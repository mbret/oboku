import { Controller, Delete, Get, Post } from "@nestjs/common"
import type {
  CreateKoreaderSyncPasswordResponse,
  GetKoreaderSyncResponse,
} from "@oboku/shared"
import { type AuthUser, WithAuthUser } from "../auth/auth.guard"
import { KoreaderSyncService } from "./koreader-sync.service"

/** The signed-in user's KOReader sync login, managed from the app. */
@Controller("koreader-sync")
export class KoreaderSyncController {
  constructor(private readonly koreaderSyncService: KoreaderSyncService) {}

  @Get()
  async get(@WithAuthUser() user: AuthUser): Promise<GetKoreaderSyncResponse> {
    const credential = await this.koreaderSyncService.findCredential(
      user.userId,
    )

    return {
      username: user.email,
      passwordCreatedAt: credential?.created_at.toISOString() ?? null,
    }
  }

  @Post("password")
  async createPassword(
    @WithAuthUser() user: AuthUser,
  ): Promise<CreateKoreaderSyncPasswordResponse> {
    const password = await this.koreaderSyncService.createPassword(user.userId)

    return { username: user.email, password }
  }

  @Delete()
  async turnOff(@WithAuthUser() user: AuthUser) {
    await this.koreaderSyncService.turnOff(user.userId)

    return { ok: true }
  }
}
