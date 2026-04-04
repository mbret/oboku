import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { InjectRepository } from "@nestjs/typeorm"
import { createHash, randomBytes } from "node:crypto"
import { IsNull, Repository } from "typeorm"
import { RefreshTokenPostgresEntity } from "./entities"

const MAX_ACTIVE_SESSIONS_PER_USER = 20
const REVOKED_TOKEN_RETENTION_MS = 7 * 24 * 60 * 60 * 1000

@Injectable()
export class RefreshTokensService {
  private readonly logger = new Logger(RefreshTokensService.name)

  constructor(
    @InjectRepository(RefreshTokenPostgresEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenPostgresEntity>,
  ) {}

  async issueTokenForInstallation({
    userId,
    installationId,
  }: {
    userId: number
    installationId: string
  }) {
    const token = this.generateToken()
    const now = new Date()

    await this.refreshTokenRepository.upsert(
      this.refreshTokenRepository.create({
        user_id: userId,
        installation_id: installationId,
        token_hash: this.hashToken(token),
        last_used_at: now,
        revoked_at: null,
      }),
      ["user_id", "installation_id"],
    )

    await this.cleanupExtraTokensForUser(userId)

    return token
  }

  async findActiveByToken(token: string) {
    const tokenHash = this.hashToken(token)

    const session = await this.refreshTokenRepository.findOne({
      where: {
        token_hash: tokenHash,
        revoked_at: IsNull(),
      },
    })

    if (!session) {
      return null
    }

    const lastUsedAt = new Date()

    await this.refreshTokenRepository.update(session.id, {
      last_used_at: lastUsedAt,
    })

    session.last_used_at = lastUsedAt

    return session
  }

  async deleteById(id: number) {
    await this.refreshTokenRepository.delete(id)
  }

  async deleteByUserId(userId: number) {
    await this.refreshTokenRepository.delete({ user_id: userId })
  }

  private async cleanupExtraTokensForUser(userId: number) {
    const sessionsToDelete = await this.refreshTokenRepository.find({
      select: ["id"],
      where: {
        user_id: userId,
        revoked_at: IsNull(),
      },
      order: {
        last_used_at: "DESC",
        created_at: "DESC",
      },
      skip: MAX_ACTIVE_SESSIONS_PER_USER,
    })

    if (sessionsToDelete.length === 0) {
      return
    }

    await this.refreshTokenRepository.delete(
      sessionsToDelete.map(({ id }) => id),
    )
  }

  /**
   * Cleanup revoked sessions after a short retention window.
   *
   * Active sessions are intentionally kept indefinitely so long-offline users
   * can still recover their session later.
   */
  @Cron("0 */10 * * * *")
  async handleCron() {
    const cutoff = new Date(Date.now() - REVOKED_TOKEN_RETENTION_MS)

    const result = await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .from(RefreshTokenPostgresEntity)
      .where("revoked_at IS NOT NULL")
      .andWhere("revoked_at < :cutoff", { cutoff })
      .execute()

    if (result.affected) {
      this.logger.debug(`Deleted ${result.affected} revoked refresh sessions`)
    }
  }

  private generateToken() {
    return randomBytes(48).toString("base64url")
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex")
  }
}
