import { Body, Controller, Post, Query } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { Public } from "./auth.guard"
import { IsEmail, IsNotEmpty, MinLength } from "class-validator"

export class SignUpDto {
  @IsEmail()
  email!: string

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
  async signup(@Body() body: SignUpDto) {
    await this.authService.signUp(body)

    return {}
  }

  @Public()
  @Post("token")
  refreshTokens(
    @Query() query: { grant_type: "refresh_token"; refresh_token: string },
  ) {
    return this.authService.refreshToken(query.grant_type, query.refresh_token)
  }
}
