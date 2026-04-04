import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { InjectRepository } from "@nestjs/typeorm"
import { createHash, randomBytes } from "node:crypto"
import { IsNull, Repository } from "typeorm"
import { RefreshTokenPostgresEntity } from "./entities"

const STALE_SESSION_RETENTION_TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000

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

  /**
   * Cleanup sessions that have not been used in a very long time.
   *
   * This keeps the table bounded without evicting active or reasonably dormant
   * installations, which is important for the offline-first auth model.
   */
  // Every day at 03:00 server time.
  @Cron("0 0 3 * * *")
  async deleteStaleSessions() {
    const cutoff = new Date(Date.now() - STALE_SESSION_RETENTION_TWO_YEARS_MS)

    const result = await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .from(RefreshTokenPostgresEntity)
      .where("last_used_at < :cutoff", { cutoff })
      .execute()

    if (result.affected) {
      this.logger.debug(`Deleted ${result.affected} stale refresh sessions`)
    }
  }

  private generateToken() {
    return randomBytes(48).toString("base64url")
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex")
  }
}
