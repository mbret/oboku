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
import { AuthService } from "./auth.service.js"
import { ApiObokuErrors } from "../openapi/api-oboku-errors.decorator.js"
import { type AuthUser, Public, WithAuthUser } from "./auth.guard.js"
import {
  type AuthTokens,
  AuthCookiesService,
  REFRESH_TOKEN_COOKIE,
} from "./auth-cookies.js"
import {
  AuthSessionResponseDto,
  CompleteMagicLinkDto,
  CompleteSignUpDto,
  CompleteSignUpResponseDto,
  LogoutDto,
  RefreshTokenQueryDto,
  RequestMagicLinkDto,
  RequestSignUpDto,
  SignInWithEmailDto,
  SignInWithGoogleDto,
} from "./auth.dto.js"
import { EmptyResponseDto } from "../openapi/empty-response.dto.js"

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookiesService: AuthCookiesService,
  ) {}

  /**
   * Moves the freshly minted tokens into httpOnly cookies and returns only the
   * body-safe half of the session. Every authenticated response goes through
   * here so the token strip and the cookie write can never be forgotten
   * independently — the tokens must not reach the JSON body.
   */
  private issueSession(
    request: Request,
    response: Response,
    {
      accessToken,
      refreshToken,
      ...session
    }: AuthTokens & AuthSessionResponseDto,
  ): AuthSessionResponseDto {
    this.authCookiesService.set(request, response, {
      accessToken,
      refreshToken,
    })

    return session
  }

  @Public()
  @ApiObokuErrors()
  @Post("signin/email")
  async signInWithEmail(
    @Body() body: SignInWithEmailDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponseDto> {
    return this.issueSession(
      request,
      response,
      await this.authService.signInWithEmail(body),
    )
  }

  @Public()
  @ApiObokuErrors()
  @Post("signin/google")
  async signInWithGoogle(
    @Body() body: SignInWithGoogleDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponseDto> {
    return this.issueSession(
      request,
      response,
      await this.authService.signInWithGoogle(body),
    )
  }

  @Public()
  @ApiObokuErrors()
  @Post("signup")
  async requestSignUp(
    @Body() body: RequestSignUpDto,
  ): Promise<EmptyResponseDto> {
    await this.authService.requestSignUp({
      email: body.email,
    })

    return {}
  }

  @Public()
  @ApiObokuErrors()
  @Post("signup/complete")
  async completeSignUp(
    @Body() body: CompleteSignUpDto,
  ): Promise<CompleteSignUpResponseDto> {
    return this.authService.completeSignUp(body)
  }

  @Public()
  @Post("magic-link")
  async requestMagicLink(
    @Body() body: RequestMagicLinkDto,
  ): Promise<EmptyResponseDto> {
    await this.authService.requestMagicLink({
      email: body.email,
    })

    return {}
  }

  @Public()
  @ApiObokuErrors()
  @Post("magic-link/complete")
  async completeMagicLink(
    @Body() body: CompleteMagicLinkDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponseDto> {
    return this.issueSession(
      request,
      response,
      await this.authService.completeMagicLink(body),
    )
  }

  @Public()
  @Post("token")
  async refreshToken(
    @Query() _query: RefreshTokenQueryDto,
    @Headers("dpop") proof: string | undefined,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<EmptyResponseDto> {
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

    return {}
  }

  /**
   * Revokes the session by its identity and leaves the cookies untouched — they
   * may belong to whoever is active now, and the revoked session's rows are
   * deleted so any lingering cookie is inert (it dies on next sign-in or at
   * cookie expiry).
   */
  @Public()
  @Post("logout")
  async logout(@Body() body: LogoutDto): Promise<EmptyResponseDto> {
    await this.authService.logout({ sessionId: body.session_id })

    return {}
  }

  @Delete("account")
  async deleteAccount(
    @WithAuthUser() user: AuthUser,
  ): Promise<EmptyResponseDto> {
    await this.authService.deleteAccount({
      userId: user.userId,
      email: user.email,
    })

    return {}
  }
}
