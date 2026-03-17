import { Body, Controller, Post, Query, Req } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { Public } from "./auth.guard"
import { IsEmail, IsNotEmpty, MinLength } from "class-validator"
import type { Request } from "express"
import { getAppPublicUrlFromRequest } from "../lib/http/getAppPublicUrlFromRequest"

export class RequestSignUpDto {
  @IsEmail()
  email!: string
}

export class CompleteSignUpDto {
  @IsNotEmpty()
  token!: string

  @IsNotEmpty()
  @MinLength(8)
  password!: string
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signin")
  async signin(
    @Body()
    body: { token: string } | { email: string; password: string },
  ) {
    return this.authService.signIn(body)
  }

  @Public()
  @Post("signup")
  async signup(@Body() body: RequestSignUpDto, @Req() request: Request) {
    await this.authService.requestSignUp({
      email: body.email,
      appPublicUrl: getAppPublicUrlFromRequest(request),
    })

    return {}
  }

  @Public()
  @Post("signup/complete")
  async completeSignup(@Body() body: CompleteSignUpDto) {
    return this.authService.completeSignUp(body)
  }

  @Public()
  @Post("token")
  refreshTokens(
    @Query() query: { grant_type: "refresh_token"; refresh_token: string },
  ) {
    return this.authService.refreshToken(query.grant_type, query.refresh_token)
  }
}
