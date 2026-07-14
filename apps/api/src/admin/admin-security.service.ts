import { BadRequestException, Injectable, Logger } from "@nestjs/common"
import type {
  GetTokenStatsResponse,
  RevokeTokensRequest,
  RevokeTokensResponse,
} from "@oboku/shared"
import { RefreshTokensService } from "src/features/postgres/refreshTokens.service"
import {
  normalizeAudienceEmails,
  UserPostgresService,
} from "src/features/postgres/user-postgres.service"

const logger = new Logger("AdminSecurityService")

@Injectable()
export class AdminSecurityService {
  constructor(
    private readonly refreshTokensService: RefreshTokensService,
    private readonly userPostgresService: UserPostgresService,
  ) {}

  async getTokenStats(): Promise<GetTokenStatsResponse> {
    return this.refreshTokensService.getStats()
  }

  async revokeTokens(
    input: RevokeTokensRequest,
  ): Promise<RevokeTokensResponse> {
    if (input.audienceType === "all") {
      const revokedTokens = await this.refreshTokensService.deleteAll()

      logger.warn(
        `Admin revoked ALL refresh tokens (${revokedTokens} token(s) deleted)`,
      )

      return { revokedTokens, targetedUsers: null }
    }

    const emails = normalizeAudienceEmails(
      input.emails,
      "At least one email is required to revoke tokens",
    )

    const userIds = await this.userPostgresService.getUserIdsByEmails(emails)

    if (userIds.length === 0) {
      throw new BadRequestException(
        "None of the provided emails match existing users",
      )
    }

    const revokedTokens =
      await this.refreshTokensService.deleteByUserIds(userIds)

    logger.warn(
      `Admin revoked refresh tokens for ${userIds.length} user(s) ` +
        `(${revokedTokens} token(s) deleted)`,
    )

    return { revokedTokens, targetedUsers: userIds.length }
  }
}
