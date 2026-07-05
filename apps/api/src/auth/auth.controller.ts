import { Body, Controller, Delete, Headers, Post, Query } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { type AuthUser, Public, WithAuthUser } from "./auth.guard"
import { Type } from "class-transformer"
import {
  Equals,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
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

/**
 * The exact P-256 JWK shape needed to compute an RFC 7638 thumbprint at
 * refresh. Anything looser would bind a session that signs in fine but can
 * never refresh. Coordinate lengths are a lax bound (P-256 encodes to 43
 * base64url chars) that mainly keeps the stored key small.
 */
export class AuthProofPublicKeyDto implements AuthProofPublicKeyJwk {
  @Equals("EC")
  kty!: string

  @Equals("P-256")
  crv!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  x!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  y!: string
}

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
  @ValidateNested()
  @Type(() => AuthProofPublicKeyDto)
  public_key!: AuthProofPublicKeyDto
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
  @ValidateNested()
  @Type(() => AuthProofPublicKeyDto)
  public_key!: AuthProofPublicKeyDto
}

export class SignInWithGoogleDto implements SignInWithGoogleRequest {
  @IsString()
  @IsNotEmpty()
  token!: string

  @IsString()
  @IsNotEmpty()
  installation_id!: string

  @IsObject()
  @ValidateNested()
  @Type(() => AuthProofPublicKeyDto)
  public_key!: AuthProofPublicKeyDto
}

export class RefreshTokenQueryDto {
  @IsString()
  @IsNotEmpty()
  grant_type!: "refresh_token"

  @IsString()
  @IsNotEmpty()
  refresh_token!: string
}

export class LogoutDto implements LogoutRequest {
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
    @Headers("dpop") proof: string | undefined,
  ): Promise<RefreshTokenResponse> {
    return this.authService.refreshToken({
      refreshToken: query.refresh_token,
      proof,
    })
  }

  @Public()
  @Post("logout")
  async logout(@Body() body: LogoutDto): Promise<LogoutResponse> {
    await this.authService.logout({ refreshToken: body.refresh_token })

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
