import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { InjectRepository } from "@nestjs/typeorm"
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto"
import { EntityManager, Repository } from "typeorm"
import { AppConfigService } from "../../config/AppConfigService"
import { RefreshTokenPostgresEntity } from "./entities"

export type RotationResult =
  | {
      status: "rotated"
      session: RefreshTokenPostgresEntity
      refreshToken: string
    }
  | { status: "invalid" }
  | { status: "reuse" }

const WHERE_TOKEN_HASH_MATCHES = "token_hash = :presentedHash"
const WHERE_TOKEN_STILL_ACTIVE = "superseded_at IS NULL"
const WHERE_TOKEN_EXPIRED = "created_at < :expiryCutoff"
const WHERE_TOKEN_SUPERSEDED_PAST_GRACE = "superseded_at < :graceCutoff"
const WHERE_SUCCESSOR_TOKEN_UNCHANGED =
  "successor_token IS NOT DISTINCT FROM :expectedSuccessorToken"

const GCM_IV_BYTES = 12
const GCM_AUTH_TAG_BYTES = 16

@Injectable()
export class RefreshTokensService {
  private readonly logger = new Logger(RefreshTokensService.name)
  private readonly successorKey = randomBytes(32)

  constructor(
    @InjectRepository(RefreshTokenPostgresEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenPostgresEntity>,
    private readonly appConfigService: AppConfigService,
  ) {}

  /**
   * Starts a fresh session for an installation on sign-in: locks any existing
   * chain for `(user_id, installation_id)`, wipes it, then inserts one active
   * token.
   *
   * Locking the chain before the wipe serializes it with a concurrent rotation
   * of any chain row (rotation CAS-locks its parent). Without the lock, under
   * READ COMMITTED a successor inserted by a rotation that commits while our
   * DELETE waits on the locked parent is invisible to the DELETE's snapshot and
   * would survive the wipe — so a thief mid-rotation would keep a live token
   * across the victim's re-login. Once the lock resolves, the DELETE is a new
   * statement with a fresh snapshot that sweeps that successor too; a rotation
   * blocked by our lock instead fails its CAS on the deleted parent and resolves
   * to `invalid` (see `resolveSuccessor`). This is the same hazard `revokeByToken`
   * guards, and it is what lets `rotateForRefresh` refuse to revoke a past-grace
   * replay: re-login is the eviction path a thief must not outlive.
   *
   * Two sign-ins for an installation with no existing chain lock nothing (there
   * are no rows yet), so they can still each insert an active token; that
   * transient multi-active state is accepted and collapses on the next sign-in's
   * wipe or TTL/grace cleanup. See the entity doc for why we don't force a single
   * active token with a partial unique index.
   */
  async issueTokenForInstallation({
    userId,
    installationId,
    publicKey,
  }: {
    userId: number
    installationId: string
    publicKey: string
  }) {
    const chain = { user_id: userId, installation_id: installationId }

    const { refreshToken } =
      await this.refreshTokenRepository.manager.transaction(async (manager) => {
        await manager.find(RefreshTokenPostgresEntity, {
          where: chain,
          lock: { mode: "pessimistic_write" },
        })

        await manager.delete(RefreshTokenPostgresEntity, chain)

        return this.insertRefreshToken(
          {
            user_id: userId,
            installation_id: installationId,
            public_key: publicKey,
          },
          manager,
        )
      })

    return refreshToken
  }

  async findByToken(presentedToken: string) {
    return this.refreshTokenRepository.findOne({
      where: { token_hash: this.hashToken(presentedToken) },
    })
  }

  /**
   * Rotates the chain for a row the caller already loaded via `findByToken`.
   * The row may have gone stale in between; every write is CAS-guarded and
   * falls back to re-reading (`resolveSuccessor`), so a stale row converges
   * instead of corrupting the chain.
   */
  async rotateForRefresh(
    presented: RefreshTokenPostgresEntity,
  ): Promise<RotationResult> {
    const now = new Date()
    const expiryCutoff = new Date(
      now.getTime() - this.appConfigService.SECURITY_REFRESH_TOKEN_TTL_MS,
    )

    if (presented.created_at <= expiryCutoff) {
      return { status: "invalid" }
    }

    if (presented.superseded_at) {
      const graceWindowEnd =
        presented.superseded_at.getTime() +
        this.appConfigService.SECURITY_REFRESH_TOKEN_ROTATION_GRACE_MS
      const isWithinGraceWindow = now.getTime() < graceWindowEnd

      if (isWithinGraceWindow) {
        return this.resolveSuccessor(presented)
      }

      // Past its grace window, a superseded token is a stale replay. We refuse
      // this one token but deliberately leave the rest of the chain — the active
      // token and any concurrent siblings — untouched, so an erratic or offline
      // client that replays an old token is never logged out as collateral.
      //
      // A replay can still be a theft signal (RFC 6819), but the time-based
      // heuristic fires on whoever falls behind, which is as likely to be the
      // legitimate user as an attacker — and our re-login already wipes the
      // installation chain, so a thief is evicted when the victim signs back in.
      // Revoking here would just log the real user out for a benign retry. We
      // log it for visibility instead; an operator can revoke a confirmed
      // compromise manually via deleteByUserId.
      this.logger.warn(
        `Refresh token replay past grace window; refused the stale token but kept the session chain (user ${presented.user_id}, installation ${presented.installation_id})`,
      )
      return { status: "reuse" }
    }

    return this.rotateActiveToken(presented, now)
  }

  private rotateActiveToken(
    presented: RefreshTokenPostgresEntity,
    now: Date,
  ): Promise<RotationResult> {
    return this.appendSuccessorUnderCas(
      presented,
      { clause: WHERE_TOKEN_STILL_ACTIVE, params: {} },
      { superseded_at: now },
    )
  }

  private async appendSuccessorUnderCas(
    parent: RefreshTokenPostgresEntity,
    guard: { clause: string; params: Record<string, unknown> },
    extraSet: Partial<Pick<RefreshTokenPostgresEntity, "superseded_at">> = {},
  ): Promise<RotationResult> {
    const successorToken = this.generateToken()

    const rotated = await this.refreshTokenRepository.manager.transaction(
      async (manager) => {
        const cas = await manager
          .createQueryBuilder()
          .update(RefreshTokenPostgresEntity)
          .set({
            ...extraSet,
            successor_token: this.encryptSuccessor(successorToken),
          })
          .where(WHERE_TOKEN_HASH_MATCHES, { presentedHash: parent.token_hash })
          .andWhere(guard.clause, guard.params)
          .execute()

        if (cas.affected !== 1) {
          return null
        }

        return this.insertRefreshToken(
          {
            user_id: parent.user_id,
            installation_id: parent.installation_id,
            public_key: parent.public_key ?? null,
            refreshToken: successorToken,
          },
          manager,
        )
      },
    )

    if (!rotated) {
      return this.resolveSuccessor(parent)
    }

    return {
      status: "rotated",
      session: rotated.session,
      refreshToken: rotated.refreshToken,
    }
  }

  private async resolveSuccessor(
    presented: RefreshTokenPostgresEntity,
  ): Promise<RotationResult> {
    const current = await this.refreshTokenRepository.findOne({
      where: { token_hash: presented.token_hash },
    })

    if (!current) {
      // The row backing this token was deleted mid-rotation — a re-login wipe,
      // an admin revoke, or stale-session cleanup ran between loading the token
      // and this read. The session was destroyed on purpose, so reject the
      // refresh instead of minting a successor; resurrecting it would re-grant a
      // token that revoke/re-login meant to kill. The caller maps a non-rotated
      // status to a 401 and the client re-authenticates.
      return { status: "invalid" }
    }

    const storedSuccessor = current.successor_token
      ? this.decryptSuccessor(current.successor_token)
      : null

    if (storedSuccessor) {
      return {
        status: "rotated",
        session: current,
        refreshToken: storedSuccessor,
      }
    }

    return this.persistFreshSuccessor(current)
  }

  private persistFreshSuccessor(
    parent: RefreshTokenPostgresEntity,
  ): Promise<RotationResult> {
    return this.appendSuccessorUnderCas(parent, {
      clause: WHERE_SUCCESSOR_TOKEN_UNCHANGED,
      params: { expectedSuccessorToken: parent.successor_token ?? null },
    })
  }

  private async insertRefreshToken(
    {
      user_id,
      installation_id,
      public_key,
      refreshToken,
    }: Pick<
      RefreshTokenPostgresEntity,
      "user_id" | "installation_id" | "public_key"
    > & {
      refreshToken?: string
    },
    manager?: EntityManager,
  ): Promise<{
    session: RefreshTokenPostgresEntity
    refreshToken: string
  }> {
    const issuedToken = refreshToken ?? this.generateToken()

    const queryBuilder = manager
      ? manager.createQueryBuilder()
      : this.refreshTokenRepository.createQueryBuilder()

    const inserted = await queryBuilder
      .insert()
      .into(RefreshTokenPostgresEntity)
      .values({
        user_id,
        installation_id,
        public_key,
        token_hash: this.hashToken(issuedToken),
        superseded_at: null,
      })
      .returning("*")
      .execute()

    return {
      // TypeORM types InsertResult.raw as `any` since its shape depends on the
      // driver; `.returning("*")` makes Postgres return the full inserted row,
      // so we assert it to the entity type.
      session: inserted.raw[0] as RefreshTokenPostgresEntity,
      refreshToken: issuedToken,
    }
  }

  private encryptSuccessor(token: string): string {
    const iv = randomBytes(GCM_IV_BYTES)
    const cipher = createCipheriv("aes-256-gcm", this.successorKey, iv)
    const ciphertext = Buffer.concat([
      cipher.update(token, "utf8"),
      cipher.final(),
    ])

    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
      "base64",
    )
  }

  private decryptSuccessor(payload: string): string | null {
    try {
      const packed = Buffer.from(payload, "base64")
      const iv = packed.subarray(0, GCM_IV_BYTES)
      const authTag = packed.subarray(
        GCM_IV_BYTES,
        GCM_IV_BYTES + GCM_AUTH_TAG_BYTES,
      )
      const ciphertext = packed.subarray(GCM_IV_BYTES + GCM_AUTH_TAG_BYTES)

      const decipher = createDecipheriv("aes-256-gcm", this.successorKey, iv)
      decipher.setAuthTag(authTag)

      return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]).toString("utf8")
    } catch {
      return null
    }
  }

  async deleteById(id: number) {
    await this.refreshTokenRepository.delete(id)
  }

  /**
   * Revokes the whole `(user_id, installation_id)` chain the presented token
   * belongs to. Superseded rows match too, so a client holding a token one
   * rotation behind still kills the active successor. Unknown tokens are a
   * no-op (RFC 7009 §2.2 semantics), keeping revocation idempotent for
   * best-effort offline clients.
   *
   * Locking the chain before deleting serializes revocation with a concurrent
   * rotation of ANY chain row (rotation CAS-locks its parent, which may be the
   * active row rather than the presented one). Without it, under READ
   * COMMITTED a successor inserted by an in-flight rotation is invisible to
   * the DELETE's snapshot and would survive a "successful" revocation. Once
   * the lock resolves, the DELETE is a new statement with a fresh snapshot, so
   * it sweeps that successor too; a rotation blocked by our lock instead fails
   * its CAS and resolves to `invalid` (see `resolveSuccessor`).
   *
   * The delete is additionally conditioned on the presented row surviving the
   * lock acquisition. A same-installation re-login (`issueTokenForInstallation`)
   * that commits in between wipes the chain — presented row included — and
   * re-issues it, so the locked rows would be the fresh session's; deleting
   * them would revoke the session the user just signed into. A vanished
   * presented row means the token is now unknown, which falls under the
   * unknown-token no-op above. Rotation never deletes the presented row, so
   * this guard cannot skip a legitimate revocation.
   */
  async revokeByToken(presentedToken: string) {
    const presentedHash = this.hashToken(presentedToken)

    await this.refreshTokenRepository.manager.transaction(async (manager) => {
      const presented = await manager.findOne(RefreshTokenPostgresEntity, {
        where: { token_hash: presentedHash },
      })

      if (!presented) {
        return
      }

      const chain = {
        user_id: presented.user_id,
        installation_id: presented.installation_id,
      }

      const lockedChain = await manager.find(RefreshTokenPostgresEntity, {
        where: chain,
        lock: { mode: "pessimistic_write" },
      })

      const chainStillContainsPresented = lockedChain.some(
        (row) => row.token_hash === presentedHash,
      )

      if (!chainStillContainsPresented) {
        return
      }

      await manager.delete(RefreshTokenPostgresEntity, chain)
    })
  }

  async deleteByUserId(userId: number) {
    await this.refreshTokenRepository.delete({ user_id: userId })
  }

  async getStats(): Promise<{
    totalTokens: number
    activeTokens: number
    distinctUsers: number
    distinctSessions: number
  }> {
    const raw = await this.refreshTokenRepository
      .createQueryBuilder("token")
      .select("COUNT(*)", "totalTokens")
      .addSelect(
        "COUNT(*) FILTER (WHERE token.superseded_at IS NULL)",
        "activeTokens",
      )
      .addSelect("COUNT(DISTINCT token.user_id)", "distinctUsers")
      .addSelect(
        "COUNT(DISTINCT (token.user_id, token.installation_id))",
        "distinctSessions",
      )
      .getRawOne<{
        totalTokens: string
        activeTokens: string
        distinctUsers: string
        distinctSessions: string
      }>()

    return {
      totalTokens: Number(raw?.totalTokens ?? 0),
      activeTokens: Number(raw?.activeTokens ?? 0),
      distinctUsers: Number(raw?.distinctUsers ?? 0),
      distinctSessions: Number(raw?.distinctSessions ?? 0),
    }
  }

  /** Revokes every refresh token in the database. Returns the number deleted. */
  async deleteAll(): Promise<number> {
    const result = await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .from(RefreshTokenPostgresEntity)
      .execute()

    return result.affected ?? 0
  }

  /** Revokes all refresh tokens owned by the given users. Returns the count. */
  async deleteByUserIds(userIds: number[]): Promise<number> {
    if (userIds.length === 0) {
      return 0
    }

    const result = await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .from(RefreshTokenPostgresEntity)
      .where("user_id IN (:...userIds)", { userIds })
      .execute()

    return result.affected ?? 0
  }

  @Cron("0 0 3 * * *")
  async deleteStaleSessions() {
    const now = Date.now()
    const expiryCutoff = new Date(
      now - this.appConfigService.SECURITY_REFRESH_TOKEN_TTL_MS,
    )
    const graceCutoff = new Date(
      now - this.appConfigService.SECURITY_REFRESH_TOKEN_ROTATION_GRACE_MS,
    )

    const result = await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .from(RefreshTokenPostgresEntity)
      .where(WHERE_TOKEN_EXPIRED, { expiryCutoff })
      .orWhere(WHERE_TOKEN_SUPERSEDED_PAST_GRACE, { graceCutoff })
      .execute()

    if (result.affected) {
      this.logger.debug(`Deleted ${result.affected} expired refresh tokens`)
    }
  }

  private generateToken() {
    return randomBytes(48).toString("base64url")
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex")
  }
}
