import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from "@nestjs/common"
import { UsersService } from "../users/users.service"
import { OAuth2Client } from "google-auth-library"
import { AppConfigService } from "../config/AppConfigService"
import { ObokuErrorCode } from "@oboku/shared"
import { CouchService } from "../couch/couch.service"
import { getOrCreateUserFromEmail } from "../lib/couch/dbHelpers"
import bcrypt from "bcrypt"
import { JwtService, TokenExpiredError } from "@nestjs/jwt"
import { RefreshTokensService } from "src/features/postgres/refreshTokens.service"
import { SecretsService } from "src/config/SecretsService"
import { EmailService } from "../email/EmailService"

type RefreshTokenPayload = {
  sub: string
  id: string
  type: "refresh"
  expires_at: Date
}

type SignUpTokenPayload = {
  sub: string
  type: "signup"
}

type MagicLinkTokenPayload = {
  sub: string
  type: "magic-link"
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private usersService: UsersService,
    private appConfigService: AppConfigService,
    private couchService: CouchService,
    private jwtService: JwtService,
    private refreshTokensService: RefreshTokensService,
    private secretService: SecretsService,
    private emailService: EmailService,
  ) {}

  async generateRefreshToken(payload: {
    email: string
    id: string
    expires_at: Date
  }) {
    return this.jwtService.signAsync(
      {
        sub: payload.email,
        id: payload.id,
        type: "refresh",
      },
      {
        algorithm: "RS256",
        expiresIn: payload.expires_at.getTime() - Date.now(),
        privateKey: await this.secretService.getJwtPrivateKey(),
      },
    )
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10 // Higher is more secure but slower
    return bcrypt.hash(password, saltRounds)
  }

  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword)
  }

  /**
   * @important
   *
   * Google sign-in is trusted for the current session only when Google returns
   * a verified email for this login attempt.
   *
   * Provider sign-in must not persist local email/password authority in the
   * merged user row. Local password access is only upgraded by Oboku's own
   * email verification flow.
   */
  async signInWithGoogle(token: string) {
    const client = new OAuth2Client()
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: this.appConfigService.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()

    if (!payload) {
      throw new BadRequestException({})
    }

    const { email, email_verified } = payload

    if (!email) {
      throw new BadRequestException({
        errors: [{ code: ObokuErrorCode.ERROR_SIGNIN_NO_EMAIL }],
      })
    }

    if (!email_verified) {
      throw new BadRequestException({
        errors: [{ code: ObokuErrorCode.ERROR_SIGNIN_EMAIL_NO_VERIFIED }],
      })
    }

    // if someone signin with google and is verified, we will always allow retrieving
    // user with the same email
    const userExists = await this.usersService.findUserByEmail(email)

    if (!userExists) {
      return await this.usersService.registerUser({
        email,
        username: email,
      })
    }

    return userExists
  }

  /**
   * @important
   *
   * The only way to signin with email and password is to:
   * - exist
   * - have password set
   * - have a locally verified email ownership
   * - validate compare
   */
  async signinWithEmail(email: string, password: string) {
    const userWithEmail = await this.usersService.findUserByEmail(email)

    /**
     * we found a user with a password that matches, so we compare them
     */
    if (typeof userWithEmail?.password === "string") {
      if (await this.comparePassword(password, userWithEmail.password)) {
        if (!userWithEmail.emailVerified) {
          throw new BadRequestException({
            errors: [{ code: ObokuErrorCode.ERROR_SIGNIN_EMAIL_NO_VERIFIED }],
          })
        }

        return userWithEmail
      }
    }

    throw new UnauthorizedException()
  }

  async generateTokens({ email }: { email: string }) {
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    // const refreshTokenEntity = await this.refreshTokensService.save({
    //   user_email: email,
    //   expires_at: refreshTokenExpiresAt,
    // })

    const accessToken = await this.couchService.generateUserJWT({
      email,
    })
    const refreshToken = await this.generateRefreshToken({
      email,
      // id: refreshTokenEntity.id,
      id: "123",
      expires_at: refreshTokenExpiresAt,
    })

    return {
      accessToken,
      refreshToken,
    }
  }

  private async completeSignInForEmail(email: string) {
    const adminNano = await this.couchService.createAdminNanoInstance()

    const couchUser = await getOrCreateUserFromEmail(adminNano, email)

    if (!couchUser) {
      throw new Error("Unable to retrieve user")
    }

    const { accessToken, refreshToken } = await this.generateTokens({
      email: couchUser.email,
    })

    const nameHex = Buffer.from(couchUser.name).toString("hex")

    return {
      accessToken,
      refreshToken,
      nameHex,
      dbName: `userdb-${nameHex}`,
      email: couchUser.email,
    }
  }

  async signIn(
    params: { token: string } | { email: string; password: string },
  ) {
    const retrievedUser =
      "token" in params
        ? await this.signInWithGoogle(params.token)
        : await this.signinWithEmail(params.email, params.password)

    return this.completeSignInForEmail(retrievedUser.email)
  }

  async generateSignUpToken(email: string) {
    return this.jwtService.signAsync(
      {
        sub: email,
        type: "signup",
      } satisfies SignUpTokenPayload,
      {
        algorithm: "RS256",
        expiresIn: "1h",
        privateKey: await this.secretService.getJwtPrivateKey(),
      },
    )
  }

  async generateMagicLinkToken(email: string) {
    return this.jwtService.signAsync(
      {
        sub: email,
        type: "magic-link",
      } satisfies MagicLinkTokenPayload,
      {
        algorithm: "RS256",
        expiresIn: "15m",
        privateKey: await this.secretService.getJwtPrivateKey(),
      },
    )
  }

  async verifySignUpToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<SignUpTokenPayload>(
        token,
        {
          secret: await this.secretService.getJwtPrivateKey(),
          algorithms: ["RS256"],
        },
      )

      if (payload.type !== "signup" || !payload.sub) {
        throw new BadRequestException({
          errors: [{ code: ObokuErrorCode.ERROR_SIGNUP_LINK_INVALID }],
        })
      }

      return payload.sub
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }

      throw new BadRequestException({
        errors: [{ code: ObokuErrorCode.ERROR_SIGNUP_LINK_INVALID }],
      })
    }
  }

  async verifyMagicLinkToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<MagicLinkTokenPayload>(
        token,
        {
          secret: await this.secretService.getJwtPrivateKey(),
          algorithms: ["RS256"],
        },
      )

      if (payload.type !== "magic-link" || !payload.sub) {
        throw new BadRequestException({
          errors: [{ code: ObokuErrorCode.ERROR_MAGIC_LINK_INVALID }],
        })
      }

      return payload.sub
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }

      throw new BadRequestException({
        errors: [{ code: ObokuErrorCode.ERROR_MAGIC_LINK_INVALID }],
      })
    }
  }

  async requestSignUp({ email }: { email: string }) {
    const user = await this.usersService.findUserByEmail(email)

    if (typeof user?.password === "string") {
      throw new BadRequestException({
        errors: [{ code: ObokuErrorCode.ERROR_ACCOUNT_ALREADY_EXISTS }],
      })
    }

    const token = await this.generateSignUpToken(email)

    try {
      await this.emailService.sendSignUpLink({
        email,
        token,
      })
    } catch (error) {
      this.logger.error(error)

      if (error instanceof BadRequestException) {
        throw error
      }

      throw new InternalServerErrorException("Unable to send sign up email")
    }
  }

  /**
   * @important
   *
   * This magic-link flow is intentionally narrow and exists only to recover
   * legacy local accounts that already have a password but have not yet proven
   * mailbox ownership to Oboku.
   *
   * Allowed:
   * - existing local account
   * - password already set
   * - emailVerified is false
   *
   * Not allowed:
   * - brand new account creation
   * - verified local accounts as a default passwordless alternative
   * - provider-only accounts without a local password
   *
   * Rationale:
   * - We need a safe bridge for older accounts created before local email
   *   verification became mandatory.
   * - We do not want inbox possession to silently become a permanent bypass for
   *   every password-based account.
   * - Redeeming this link upgrades the local account exactly once by setting
   *   emailVerified to true, after which normal password sign-in should be used.
   */
  async requestMagicLink({ email }: { email: string }) {
    const user = await this.usersService.findUserByEmail(email)

    if (typeof user?.password !== "string" || user.emailVerified === true) {
      return
    }

    const token = await this.generateMagicLinkToken(email)

    try {
      await this.emailService.sendMagicLink({
        email,
        token,
      })
    } catch (error) {
      this.logger.error(error)

      if (error instanceof BadRequestException) {
        throw error
      }

      throw new InternalServerErrorException("Unable to send magic link email")
    }
  }

  async generateSignUpLink({
    email,
    appPublicUrl,
  }: {
    email: string
    appPublicUrl?: string
  }) {
    const token = await this.generateSignUpToken(email)

    return this.emailService.getSignUpLink({
      appPublicUrl,
      token,
    })
  }

  async completeSignUp({
    token,
    password,
  }: {
    token: string
    password: string
  }) {
    const email = await this.verifySignUpToken(token)
    const user = await this.usersService.findUserByEmail(email)

    if (typeof user?.password === "string") {
      throw new BadRequestException({
        errors: [{ code: ObokuErrorCode.ERROR_ACCOUNT_ALREADY_EXISTS }],
      })
    }

    const hashedPassword = await this.hashPassword(password)

    if (user) {
      user.password = hashedPassword
      user.emailVerified = true

      await this.usersService.saveUser(user)
    } else {
      await this.usersService.registerUser({
        email,
        emailVerified: true,
        password: hashedPassword,
        username: email,
      })
    }

    return { email }
  }

  async completeMagicLink({ token }: { token: string }) {
    const email = await this.verifyMagicLinkToken(token)
    const user = await this.usersService.findUserByEmail(email)

    if (
      !user ||
      typeof user.password !== "string" ||
      user.emailVerified === true
    ) {
      throw new BadRequestException({
        errors: [{ code: ObokuErrorCode.ERROR_MAGIC_LINK_INVALID }],
      })
    }

    user.emailVerified = true
    await this.usersService.saveUser(user)

    return this.completeSignInForEmail(email)
  }

  async refreshToken(grant_type: "refresh_token", refreshToken: string) {
    void grant_type

    try {
      const { sub } = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: await this.secretService.getJwtPrivateKey(),
          algorithms: ["RS256"],
        },
      )

      // await this.refreshTokensService.deleteById(id)

      return this.generateTokens({
        email: sub,
      })
    } catch (error) {
      // change to cleanup expired tokens
      if (error instanceof TokenExpiredError) {
        const { id } = this.jwtService.decode<RefreshTokenPayload>(refreshToken)

        await this.refreshTokensService.deleteById(id)
      }

      throw new UnauthorizedException()
    }
  }
}
