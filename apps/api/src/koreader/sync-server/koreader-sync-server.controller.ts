import { Controller, Delete, Get, Post } from "@nestjs/common"
import { type AuthUser, WithAuthUser } from "../../auth/auth.guard.js"
import { OkResponseDto } from "../../lib/ok-response.dto.js"
import {
  KoreaderSyncServerPasswordResponseDto,
  KoreaderSyncServerResponseDto,
} from "./koreader-sync-server.dto.js"
import { KoreaderSyncServerService } from "./koreader-sync-server.service.js"

/** The signed-in user's login to oboku's KOReader sync server, managed from the app. */
@Controller("koreader-sync-server")
export class KoreaderSyncServerController {
  constructor(
    private readonly koreaderSyncServerService: KoreaderSyncServerService,
  ) {}

  @Get()
  async get(
    @WithAuthUser() user: AuthUser,
  ): Promise<KoreaderSyncServerResponseDto> {
    const credential = await this.koreaderSyncServerService.findCredential(
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
  ): Promise<KoreaderSyncServerPasswordResponseDto> {
    const password = await this.koreaderSyncServerService.createPassword(
      user.userId,
    )

    return { username: user.email, password }
  }

  @Delete()
  async turnOff(@WithAuthUser() user: AuthUser): Promise<OkResponseDto> {
    await this.koreaderSyncServerService.turnOff(user.userId)

    return { ok: true }
  }
}
