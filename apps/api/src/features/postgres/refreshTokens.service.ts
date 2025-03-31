import { Injectable, Logger } from "@nestjs/common"
// import { InjectRepository } from "@nestjs/typeorm"
// import { Repository } from "typeorm"
// import { RefreshTokenPostgresEntity } from "./entities"
import { Cron } from "@nestjs/schedule"

const logger = new Logger("RefreshTokensService")

@Injectable()
export class RefreshTokensService {
  // biome-ignore lint/complexity/noUselessConstructor: <explanation>
  constructor(
    // @InjectRepository(RefreshTokenPostgresEntity)
    // private readonly refreshTokenRepository: Repository<RefreshTokenPostgresEntity>,
  ) {}

  async save(
    // data: Omit<RefreshTokenPostgresEntity, "id" | "revoked" | "created_at">,
  ) {
    // Before saving new token, check and cleanup if necessary
    // const userTokenCount = await this.refreshTokenRepository.count({
    //   where: { user_email: data.user_email },
    // })
    // const MAX_TOKENS_PER_USER_DEVICE = 20
    // if (userTokenCount >= MAX_TOKENS_PER_USER_DEVICE) {
    //   // Find and remove the oldest token(s)
    //   const oldestTokens = await this.refreshTokenRepository.find({
    //     where: { user_email: data.user_email },
    //     order: { created_at: "ASC" },
    //     take: userTokenCount - MAX_TOKENS_PER_USER_DEVICE + 1, // +1 to make room for the new token
    //   })
    //   logger.debug(
    //     `Removing ${userTokenCount - MAX_TOKENS_PER_USER_DEVICE} extra tokens from user ${data.user_email} to make space`,
    //   )
    //   await this.refreshTokenRepository.remove(oldestTokens)
    // }
    // return this.refreshTokenRepository.save(data)
  }

  async findById(id: string) {
    // return this.refreshTokenRepository.findOne({ where: { id } })
  }

  async deleteById(id: string) {
    // await this.refreshTokenRepository.delete(id)
  }

  /**
   * Cleanup expired tokens from db every 10 minutes
   */
  @Cron("0 */10 * * * *")
  async handleCron() {
    // const tokens = await this.refreshTokenRepository.find()
    // console.log(tokens.length)
    // for (const token of tokens) {
    //   if (token.expires_at < new Date()) {
    //     logger.log(
    //       "[cron]",
    //       `Cleaning up token expired ${token.id} for ${token.user_email}`,
    //     )
    //     await this.refreshTokenRepository.delete(token.id)
    //   }
    // }
  }
}
