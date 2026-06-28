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

  async issueTokenForInstallation({
    userId,
    installationId,
  }: {
    userId: number
    installationId: string
  }) {
    const { refreshToken } =
      await this.refreshTokenRepository.manager.transaction(async (manager) => {
        await manager.delete(RefreshTokenPostgresEntity, {
          user_id: userId,
          installation_id: installationId,
        })

        return this.insertRefreshToken(
          {
            user_id: userId,
            installation_id: installationId,
          },
          manager,
        )
      })

    return refreshToken
  }

  async rotateForRefresh(presentedToken: string): Promise<RotationResult> {
    const now = new Date()
    const presentedHash = this.hashToken(presentedToken)
    const expiryCutoff = new Date(
      now.getTime() - this.appConfigService.SECURITY_REFRESH_TOKEN_TTL_MS,
    )

    const presented = await this.refreshTokenRepository.findOne({
      where: { token_hash: presentedHash },
    })

    if (!presented || presented.created_at <= expiryCutoff) {
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

      // A token presented past its grace window is a replay. Per OAuth refresh
      // rotation best practice (RFC 6819), this is a theft signal, so revoke the
      // whole session chain — including the currently-active successor a thief
      // may be holding — and force a fresh login.
      await this.revokeInstallationChain(
        presented.user_id,
        presented.installation_id,
      )
      this.logger.warn(
        `Refresh token reuse detected; revoked session chain (user ${presented.user_id}, installation ${presented.installation_id})`,
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
      return this.mintFreshSuccessor(presented)
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

  private async mintFreshSuccessor(
    parent: RefreshTokenPostgresEntity,
  ): Promise<RotationResult> {
    const { session, refreshToken } = await this.insertRefreshToken({
      user_id: parent.user_id,
      installation_id: parent.installation_id,
    })

    return { status: "rotated", session, refreshToken }
  }

  private async revokeInstallationChain(
    userId: number,
    installationId: string,
  ) {
    await this.refreshTokenRepository.delete({
      user_id: userId,
      installation_id: installationId,
    })
  }

  private async insertRefreshToken(
    {
      user_id,
      installation_id,
      refreshToken,
    }: Pick<RefreshTokenPostgresEntity, "user_id" | "installation_id"> & {
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

  async deleteByUserId(userId: number) {
    await this.refreshTokenRepository.delete({ user_id: userId })
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
