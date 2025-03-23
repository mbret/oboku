import { BadRequestException, Injectable } from "@nestjs/common"
import { UsersService } from "../users/users.service"
import { OAuth2Client } from "google-auth-library"
import { AppConfigService } from "src/features/config/AppConfigService"
import { ObokuErrorCode } from "@oboku/shared"
import { CouchService } from "src/couch/couch.service"
import { getOrCreateUserFromEmail } from "src/lib/couch/dbHelpers"

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private appConfigService: AppConfigService,
    private couchService: CouchService,
  ) {}

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

    const userAuthToken = await this.couchService.generateUserJWT({
      email: retrievedUser.email,
    })

    const signedUser = {
      token: userAuthToken,
      email: retrievedUser.email,
    }

    const adminNano = await this.couchService.createAdminNanoInstance()

    const couchUser = await getOrCreateUserFromEmail(
      adminNano,
      signedUser.email,
    )

    if (!couchUser) {
      throw new Error("Unable to retrieve user")
    }

    const nameHex = Buffer.from(couchUser.name).toString("hex")

    return {
      token: signedUser.token,
      nameHex,
      dbName: `userdb-${nameHex}`,
      email: couchUser.email,
    }
  }
}
