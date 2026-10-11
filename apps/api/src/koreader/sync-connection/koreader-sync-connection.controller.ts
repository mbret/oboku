import { Body, Controller, Delete, Get, Put } from "@nestjs/common"
import type {
  ConnectKoreaderSyncServerRequest,
  GetKoreaderSyncConnectionResponse,
} from "@oboku/shared"
import { IsString, IsUrl, MinLength } from "class-validator"
import { type AuthUser, WithAuthUser } from "../../auth/auth.guard.js"
import { KoreaderSyncConnectionService } from "./koreader-sync-connection.service.js"

class ConnectKoreaderSyncServerDto implements ConnectKoreaderSyncServerRequest {
  @IsUrl({
    require_tld: false,
    require_protocol: true,
    protocols: ["http", "https"],
  })
  serverUrl!: string

  @IsString()
  @MinLength(1)
  username!: string

  @IsString()
  @MinLength(1)
  password!: string
}

/** The KOReader sync server the signed-in user connects oboku's reader to. */
@Controller("koreader-sync-connection")
export class KoreaderSyncConnectionController {
  constructor(
    private readonly koreaderSyncConnectionService: KoreaderSyncConnectionService,
  ) {}

  @Get()
  async get(
    @WithAuthUser() user: AuthUser,
  ): Promise<GetKoreaderSyncConnectionResponse> {
    return {
      connection: await this.koreaderSyncConnectionService.find(user.userId),
    }
  }

  @Put()
  async connect(
    @WithAuthUser() user: AuthUser,
    @Body() body: ConnectKoreaderSyncServerDto,
  ): Promise<GetKoreaderSyncConnectionResponse> {
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
  async disconnect(@WithAuthUser() user: AuthUser) {
    await this.koreaderSyncConnectionService.disconnect(user.userId)

    return { ok: true }
  }
}
