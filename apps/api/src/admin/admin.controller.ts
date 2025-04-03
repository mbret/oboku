import { Body, Controller, Post, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { AuthUser, Public, WithAuthUser } from "src/auth/auth.guard"
import { AppConfigService } from "src/config/AppConfigService"
import { SecretsService } from "src/config/SecretsService"
import { CouchMigrationService } from "src/couch/migration.service"

@Controller("admin")
export class AdminController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly secretsService: SecretsService,
    private readonly appConfig: AppConfigService,
    private readonly couchMigrationService: CouchMigrationService,
  ) {}

  @Public()
  @Post("signin")
  async signin(@Body() body: { login: string; password: string }) {
    if (
      (this.appConfig.ADMIN_LOGIN?.length ?? 0) < 1 ||
      (this.appConfig.ADMIN_PASSWORD?.length ?? 0) < 1
    ) {
      console.error("Admin credentials not set")

      throw new UnauthorizedException()
    }

    if (
      body.login !== this.appConfig.ADMIN_LOGIN ||
      body.password !== this.appConfig.ADMIN_PASSWORD
    ) {
      throw new UnauthorizedException()
    }

    return {
      access_token: await this.jwtService.signAsync(
        {
          sub: "admin",
          role: "admin",
        },
        {
          algorithm: "RS256",
          expiresIn: "15m",
          privateKey: await this.secretsService.getJwtPrivateKey(),
        },
      )
    }
  }

  @Post("migrate")
  async migrate(@WithAuthUser() user: AuthUser) {
    if (user.role !== "admin") {
      throw new UnauthorizedException()
    }

    await this.couchMigrationService.migrate()
  }
}
