import { Body, Controller, Delete, Post, Query } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { type AuthUser, Public, WithAuthUser } from "./auth.guard"
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator"
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
  SignInWithEmailRequest,
  SignInWithGoogleRequest,
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

export class SignInWithEmailDto implements SignInWithEmailRequest {
  @IsEmail()
  email!: string

  @IsString()
  @IsNotEmpty()
  password!: string

  @IsString()
  @IsNotEmpty()
  installation_id!: string
}

export class SignInWithGoogleDto implements SignInWithGoogleRequest {
  @IsString()
  @IsNotEmpty()
  token!: string

  @IsString()
  @IsNotEmpty()
  installation_id!: string
}

export class RefreshTokenQueryDto {
  @IsString()
  @IsNotEmpty()
  grant_type!: "refresh_token"

  @IsString()
  @IsNotEmpty()
  refresh_token!: string
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signin/email")
  async signinWithEmail(
    @Body() body: SignInWithEmailDto,
  ): Promise<AuthSessionResponse> {
    return this.authService.signInWithEmail(body)
  }

  @Public()
  @Post("signin/google")
  async signinWithGoogle(
    @Body() body: SignInWithGoogleDto,
  ): Promise<AuthSessionResponse> {
    return this.authService.signInWithGoogle(body)
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
    @Query() query: RefreshTokenQueryDto,
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
