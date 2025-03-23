import { BadRequestException, Body, Controller, Post } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "../config/types"
import { getParametersValue } from "../../lib/ssm"
import { getFirebaseApp } from "../../lib/firebase/app"
import { App } from "firebase-admin/app"
import { ObokuErrorCode } from "@oboku/shared"
import { generateToken } from "../../lib/auth"
import {
  getDangerousAdminNano,
  getOrCreateUserFromEmail,
} from "../../lib/couch/dbHelpers"
import { OAuth2Client } from "google-auth-library"
import { AppConfigService } from "../config/AppConfigService"

@Controller("auth")
export class AuthController {
  protected firebaseApp: App

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly appConfigService: AppConfigService,
  ) {
    this.firebaseApp = getFirebaseApp(
      this.configService.getOrThrow("FIREBASE_CONFIG", { infer: true }),
    )
  }

  @Post("signin")
  async signin(@Body() { token }: { token: string }) {
    const [jwtPrivateKey = ``, xAccessSecret = ``] = await getParametersValue({
      Names: ["jwt-private-key", "x-access-secret"],
      WithDecryption: true,
    })

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

    const adminNano = await getDangerousAdminNano({
      privateKey: jwtPrivateKey,
      xAccessSecret,
      couchDbUrl: this.configService.getOrThrow("COUCH_DB_URL", {
        infer: true,
      }),
    })

    const user = await getOrCreateUserFromEmail(adminNano, email)

    if (!user) {
      throw new Error("Unable to retrieve user")
    }

    const nameHex = Buffer.from(user.name).toString("hex")
    const userJwtToken = await generateToken(user.name, jwtPrivateKey)

    return {
      token: userJwtToken,
      nameHex,
      dbName: `userdb-${nameHex}`,
      email: user.email,
    }
  }
}
