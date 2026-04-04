import { Body, Controller, Delete, Post, Query } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { type AuthUser, Public, WithAuthUser } from "./auth.guard"
import { IsEmail, IsNotEmpty, MinLength } from "class-validator"
import type {
  AuthSessionResponse,
  CompleteMagicLinkRequest,
  CompleteMagicLinkResponse,
  CompleteSignUpRequest,
  CompleteSignUpResponse,
  DeleteAccountResponse,
  RefreshTokenResponse,
  RequestMagicLinkRequest,
  RequestMagicLinkResponse,
  RequestSignUpRequest,
  RequestSignUpResponse,
  SignInRequest,
} from "@oboku/shared"

export class RequestSignUpDto implements RequestSignUpRequest {
  @IsEmail()
  email!: string
}

export class RequestMagicLinkDto implements RequestMagicLinkRequest {
  @IsEmail()
  email!: string
}

export class CompleteSignUpDto implements CompleteSignUpRequest {
  @IsNotEmpty()
  token!: string

  @IsNotEmpty()
  @MinLength(8)
  password!: string
}

export class CompleteMagicLinkDto implements CompleteMagicLinkRequest {
  @IsNotEmpty()
  token!: string

  @IsNotEmpty()
  installation_id!: string
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signin")
  async signin(@Body() body: SignInRequest): Promise<AuthSessionResponse> {
    return this.authService.signIn(body)
  }

  @Public()
  @Post("signup")
  async signup(@Body() body: RequestSignUpDto): Promise<RequestSignUpResponse> {
    await this.authService.requestSignUp({
      email: body.email,
    })

    return {}
  }

  @Public()
  @Post("signup/complete")
  async completeSignup(
    @Body() body: CompleteSignUpDto,
  ): Promise<CompleteSignUpResponse> {
    return this.authService.completeSignUp(body)
  }

  @Public()
  @Post("magic-link")
  async requestMagicLink(
    @Body() body: RequestMagicLinkDto,
  ): Promise<RequestMagicLinkResponse> {
    await this.authService.requestMagicLink({
      email: body.email,
    })

    return {}
  }

  @Public()
  @Post("magic-link/complete")
  async completeMagicLink(
    @Body() body: CompleteMagicLinkDto,
  ): Promise<CompleteMagicLinkResponse> {
    return this.authService.completeMagicLink(body)
  }

  @Public()
  @Post("token")
  refreshTokens(
    @Query() query: { grant_type: "refresh_token"; refresh_token: string },
  ): Promise<RefreshTokenResponse> {
    return this.authService.refreshToken(query.grant_type, query.refresh_token)
  }

  @Delete("account")
  async deleteAccount(
    @WithAuthUser() user: AuthUser,
  ): Promise<DeleteAccountResponse> {
    await this.authService.deleteAccount({
      userId: user.userId,
      email: user.email,
    })

    return {}
  }
}
