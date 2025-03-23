import { Body, Controller, Post } from "@nestjs/common"
import { AuthService } from "src/auth/auth.service"
import { Public } from "src/auth/auth.guard"
import { getOrCreateUserFromEmail } from "src/lib/couch/dbHelpers"
import { AppConfigService } from "src/features/config/AppConfigService"
import { getDangerousAdminNano } from "src/lib/couch/dbHelpers"

@Controller("auth")
export class AuthController {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post("signin")
  async signin(@Body() { token }: { token: string }) {
    const signedUser = await this.authService.signIn({ token })

    const adminNano = await getDangerousAdminNano({
      privateKey: this.appConfigService.JWT_PRIVATE_KEY,
      xAccessSecret: this.appConfigService.X_ACCESS_SECRET,
      couchDbUrl: this.appConfigService.COUCH_DB_URL,
    })

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
