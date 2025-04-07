import {
  BadRequestException,
  Get,
  Injectable,
  Req,
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

type RefreshTokenPayload = {
  sub: string
  id: string
  type: "refresh"
  expires_at: Date
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private appConfigService: AppConfigService,
    private couchService: CouchService,
    private jwtService: JwtService,
    private refreshTokensService: RefreshTokensService,
    private secretService: SecretsService,
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
   * Signin with google authorize you even if you have a password set.
   * This is only if your email is verified. In this case we assume any user
   * with your email belongs to you.
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
   * - validate compare
   */
  async signinWithEmail(email: string, password: string) {
    const userWithEmail = await this.usersService.findUserByEmail(email)

    /**
     * we found a user with a password that matches, so we compare them
     */
    if (typeof userWithEmail?.password === "string") {
      if (await this.comparePassword(password, userWithEmail.password)) {
        return userWithEmail
      }
    }

    throw new UnauthorizedException()
  }

  async generateTokens({
    email,
  }: {
    email: string
  }) {
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

  async signIn(
    params: { token: string } | { email: string; password: string },
  ) {
    const retrievedUser =
      "token" in params
        ? await this.signInWithGoogle(params.token)
        : await this.signinWithEmail(params.email, params.password)

    const adminNano = await this.couchService.createAdminNanoInstance()

    const couchUser = await getOrCreateUserFromEmail(
      adminNano,
      retrievedUser.email,
    )

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

  async signUp({ email, password }: { email: string; password: string }) {
    const user = await this.usersService.findUserByEmail(email)

    if (user) {
      throw new BadRequestException({})
    }

    const hashedPassword = await this.hashPassword(password)

    await this.usersService.registerUser({
      email,
      password: hashedPassword,
      username: email,
    })
  }

  async refreshToken(grant_type: "refresh_token", refreshToken: string) {
    try {
      const { id, sub } =
        await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
          secret: await this.secretService.getJwtPrivateKey(),
          algorithms: ["RS256"],
        })

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
