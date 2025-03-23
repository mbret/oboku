import { BadRequestException, Injectable } from "@nestjs/common"
import { UsersService } from "../users/users.service"
import { JwtService } from "@nestjs/jwt"
import { OAuth2Client } from "google-auth-library"
import { AppConfigService } from "src/features/config/AppConfigService"
import { ObokuErrorCode } from "@oboku/shared"

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private appConfigService: AppConfigService,
  ) {}

  async generateJwt(payload: {
    sub: string // enail
    name: string // email
    "_couchdb.roles": [string]
  }) {
    return this.jwtService.sign(payload, {
      privateKey: this.appConfigService.JWT_PRIVATE_KEY,
      algorithm: "RS256",
    })
  }

  async signIn({ token }: { token: string }) {
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

    const userExists = await this.usersService.findUserByEmail(email)

    const createdUser = async () => {
      return await this.usersService.registerUser({
        email,
        username: email,
      })
    }

    const retrievedUser = !userExists ? await createdUser() : userExists

    return {
      token: await this.generateJwt({
        name: retrievedUser.email,
        sub: retrievedUser.email,
        "_couchdb.roles": [retrievedUser.email],
      }),
      email: retrievedUser.email,
    }
  }
}
