import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Post,
  Put,
} from "@nestjs/common"
import { type AuthUser, WithAuthUser } from "../../auth/auth.guard.js"
import { ApiObokuErrors } from "../../openapi/api-oboku-errors.decorator.js"
import { OkResponseDto } from "../../openapi/ok-response.dto.js"
import {
  ConnectGoogleAccountDto,
  GoogleAccessTokenResponseDto,
  GoogleConnectionResponseDto,
} from "./google-connection.dto.js"
import { GoogleConnectionService } from "./google-connection.service.js"

/** The Google account the signed-in user lets the API reach Drive with. */
@Controller("provider-connections/google")
export class GoogleConnectionController {
  constructor(
    private readonly googleConnectionService: GoogleConnectionService,
  ) {}

  @Get()
  async get(
    @WithAuthUser() user: AuthUser,
  ): Promise<GoogleConnectionResponseDto> {
    return {
      connection: await this.googleConnectionService.find(user.userId),
    }
  }

  @ApiObokuErrors()
  @Put()
  async connect(
    @WithAuthUser() user: AuthUser,
    @Body() body: ConnectGoogleAccountDto,
  ): Promise<GoogleConnectionResponseDto> {
    return {
      connection: await this.googleConnectionService.connect({
        userId: user.userId,
        code: body.code,
      }),
    }
  }

  // RFC 6749 §5.1: a response that carries a token must not be cached.
  @ApiObokuErrors()
  @Header("Cache-Control", "no-store")
  @Header("Pragma", "no-cache")
  @Post("access-token")
  mintAccessToken(
    @WithAuthUser() user: AuthUser,
  ): Promise<GoogleAccessTokenResponseDto> {
    return this.googleConnectionService.mintAccessToken(user.userId)
  }

  @Delete()
  async disconnect(@WithAuthUser() user: AuthUser): Promise<OkResponseDto> {
    await this.googleConnectionService.disconnect(user.userId)

    return { ok: true }
  }
}
