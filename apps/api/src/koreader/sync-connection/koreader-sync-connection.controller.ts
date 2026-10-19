import { Body, Controller, Delete, Get, Param, Put } from "@nestjs/common"
import { type AuthUser, WithAuthUser } from "../../auth/auth.guard.js"
import { OkResponseDto } from "../../lib/ok-response.dto.js"
import {
  ConnectKoreaderSyncServerDto,
  KoreaderSyncConnectionResponseDto,
  KoreaderSyncPositionResponseDto,
  PushKoreaderSyncPositionDto,
} from "./koreader-sync-connection.dto.js"
import { KoreaderSyncConnectionService } from "./koreader-sync-connection.service.js"

/** The KOReader sync server the signed-in user connects oboku's reader to. */
@Controller("koreader-sync-connection")
export class KoreaderSyncConnectionController {
  constructor(
    private readonly koreaderSyncConnectionService: KoreaderSyncConnectionService,
  ) {}

  @Get()
  async get(
    @WithAuthUser() user: AuthUser,
  ): Promise<KoreaderSyncConnectionResponseDto> {
    return {
      connection: await this.koreaderSyncConnectionService.find(user.userId),
    }
  }

  @Put()
  async connect(
    @WithAuthUser() user: AuthUser,
    @Body() body: ConnectKoreaderSyncServerDto,
  ): Promise<KoreaderSyncConnectionResponseDto> {
    return {
      connection: await this.koreaderSyncConnectionService.connect({
        userId: user.userId,
        serverUrl: body.serverUrl,
        username: body.username,
        password: body.password,
      }),
    }
  }

  @Delete()
  async disconnect(@WithAuthUser() user: AuthUser): Promise<OkResponseDto> {
    await this.koreaderSyncConnectionService.disconnect(user.userId)

    return { ok: true }
  }

  @Put("progress")
  async pushPosition(
    @WithAuthUser() user: AuthUser,
    @Body() body: PushKoreaderSyncPositionDto,
  ): Promise<OkResponseDto> {
    await this.koreaderSyncConnectionService.pushPosition({
      userId: user.userId,
      position: body,
    })

    return { ok: true }
  }

  @Get("progress/:document")
  async pullPosition(
    @WithAuthUser() user: AuthUser,
    @Param("document") document: string,
  ): Promise<KoreaderSyncPositionResponseDto> {
    return {
      position: await this.koreaderSyncConnectionService.pullPosition({
        userId: user.userId,
        document,
      }),
    }
  }
}
