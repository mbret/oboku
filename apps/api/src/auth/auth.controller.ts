import {
  Body,
  Controller,
  Delete,
  Headers,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common"
import type { Request, Response } from "express"
import { AuthService } from "./auth.service"
import { type AuthUser, Public, WithAuthUser } from "./auth.guard"
import { AuthCookiesService, REFRESH_TOKEN_COOKIE } from "./auth-cookies"
import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator"
import type {
  AuthProofPublicKeyJwk,
  AuthSessionResponse,
  CompleteMagicLinkRequest,
  CompleteMagicLinkResponse,
  CompleteSignUpRequest,
  CompleteSignUpResponse,
  DeleteAccountResponse,
  LogoutRequest,
  LogoutResponse,
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

  @IsObject()
  public_key!: AuthProofPublicKeyJwk
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

  @IsObject()
  public_key!: AuthProofPublicKeyJwk
}

export class SignInWithGoogleDto implements SignInWithGoogleRequest {
  @IsString()
  @IsNotEmpty()
  token!: string

  @IsString()
  @IsNotEmpty()
  installation_id!: string

  @IsObject()
  public_key!: AuthProofPublicKeyJwk
}

export class RefreshTokenQueryDto {
  @IsString()
  @IsNotEmpty()
  grant_type!: "refresh_token"
}

export class LogoutDto implements LogoutRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refresh_token?: string
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookiesService: AuthCookiesService,
  ) {}

  @Public()
  @Post("signin/email")
  async signinWithEmail(
    @Body() body: SignInWithEmailDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponse> {
    const session = await this.authService.signInWithEmail(body)

    this.authCookiesService.set(request, response, session)

    return session
  }

  @Public()
  @Post("signin/google")
  async signinWithGoogle(
    @Body() body: SignInWithGoogleDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponse> {
    const session = await this.authService.signInWithGoogle(body)

    this.authCookiesService.set(request, response, session)

    return session
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
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CompleteMagicLinkResponse> {
    const session = await this.authService.completeMagicLink(body)

    this.authCookiesService.set(request, response, session)

    return session
  }

  @Public()
  @Post("token")
  async refreshTokens(
    @Query() _query: RefreshTokenQueryDto,
    @Headers("dpop") proof: string | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RefreshTokenResponse> {
    const refreshToken: string | undefined =
      request.cookies?.[REFRESH_TOKEN_COOKIE]

    if (!refreshToken) {
      throw new UnauthorizedException()
    }

    const tokens = await this.authService.refreshToken({
      refreshToken,
      proof,
    })

    this.authCookiesService.set(request, response, tokens)

    return tokens
  }

  @Public()
  @Post("logout")
  async logout(
    @Body() body: LogoutDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LogoutResponse> {
    const cookieRefreshToken: string | undefined =
      request.cookies?.[REFRESH_TOKEN_COOKIE]
    const refreshToken = body?.refresh_token ?? cookieRefreshToken

    if (refreshToken) {
      await this.authService.logout({ refreshToken })
    }

    // A body token targets a specific chain (admin, legacy clients) while the
    // cookies may belong to a newer session on this browser; only clear the
    // cookies when they are (or may be) the credential being revoked.
    const revokesAnotherSession =
      !!body?.refresh_token &&
      !!cookieRefreshToken &&
      body.refresh_token !== cookieRefreshToken

    if (!revokesAnotherSession) {
      this.authCookiesService.clear(request, response)
    }

    return {}
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
