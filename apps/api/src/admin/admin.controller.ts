import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { AuthService } from "src/auth/auth.service"
import { AdminAuthGuard, AdminPublic } from "./admin.guard"
import { AppConfigService } from "src/config/AppConfigService"
import { InstanceConfigService } from "./instance-config/instance-config.service"
import { SecretsService } from "src/config/SecretsService"
import { CouchMigrationService } from "src/couch/migration.service"
import { AdminCoversService } from "./admin-covers.service"
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from "class-validator"

class GenerateSignUpLinkDto {
  @IsEmail()
  email!: string

  @IsOptional()
  @IsUrl({
    require_tld: false,
    require_protocol: true,
  })
  appPublicUrl?: string
}

class CreateServerSourceDto {
  @IsString()
  @MinLength(1)
  name!: string

  @IsString()
  @MinLength(1)
  path!: string

  @IsBoolean()
  @IsOptional()
  enabled?: boolean
}

class UpdateServerSourceDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string

  @IsString()
  @MinLength(1)
  @IsOptional()
  path?: string

  @IsBoolean()
  @IsOptional()
  enabled?: boolean
}

class UpdateServerSyncDto {
  @IsBoolean()
  enabled!: boolean
}

class RefreshDto {
  @IsString()
  refresh_token!: string
}

/**
 * Opts out of the global {@link AuthGuard} (user auth) so that admin
 * routes are not subject to regular user authentication.
 * {@link AdminAuthGuard} is applied instead to enforce admin-specific
 * authentication on every route (unless marked {@link AdminPublic}).
 */
@SetMetadata("isPublic", true)
@UseGuards(AdminAuthGuard)
@Controller("admin")
export class AdminController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly secretsService: SecretsService,
    private readonly appConfig: AppConfigService,
    private readonly instanceConfigService: InstanceConfigService,
    private readonly couchMigrationService: CouchMigrationService,
    private readonly adminCoversService: AdminCoversService,
    private readonly authService: AuthService,
  ) {}

  private async signAdminTokens() {
    const privateKey = await this.secretsService.getJwtPrivateKey()

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        { sub: "admin", role: "admin", type: "access" },
        { algorithm: "RS256", expiresIn: "15m", privateKey },
      ),
      this.jwtService.signAsync(
        { sub: "admin", type: "refresh" },
        { algorithm: "RS256", expiresIn: "7d", privateKey },
      ),
    ])

    return { access_token, refresh_token }
  }

  @AdminPublic()
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

    return this.signAdminTokens()
  }

  @AdminPublic()
  @Post("refresh")
  async refresh(@Body() body: RefreshDto) {
    try {
      const payload = await this.jwtService.verifyAsync(body.refresh_token, {
        publicKey: await this.secretsService.getJwtPublicKey(),
        algorithms: ["RS256"],
      })

      if (payload.type !== "refresh" || payload.sub !== "admin") {
        throw new UnauthorizedException()
      }
    } catch {
      throw new UnauthorizedException()
    }

    return this.signAdminTokens()
  }

  @Post("migrate")
  async migrate() {
    await this.couchMigrationService.migrate()
  }

  @Post("migrate-webdav-connectors")
  async migrateWebdavConnectors() {
    return this.couchMigrationService.migrateWebdavConnectorsToConnectors()
  }

  @Post("migrate-webdav-resource-ids")
  async migrateWebdavResourceIds() {
    return this.couchMigrationService.migrateWebdavResourceIds()
  }

  @Get("covers")
  async getCoversCleanupStats() {
    return this.adminCoversService.getCleanupStats()
  }

  @Post("covers/delete-all")
  async deleteAllCovers() {
    return this.adminCoversService.deleteAllCovers()
  }

  @Post("signup-links")
  async generateSignUpLink(@Body() body: GenerateSignUpLinkDto) {
    return {
      signUpLink: await this.authService.generateSignUpLink(body),
    }
  }

  @Get("server-sync")
  async getServerSync() {
    const config = await this.instanceConfigService.getConfig()

    return { enabled: config.serverSync.enabled }
  }

  @Patch("server-sync")
  async updateServerSync(@Body() body: UpdateServerSyncDto) {
    await this.instanceConfigService.updateConfig((config) => ({
      ...config,
      serverSync: { ...config.serverSync, enabled: body.enabled },
    }))

    return { enabled: body.enabled }
  }

  @Get("server-sync/sources")
  async listServerSources() {
    return this.instanceConfigService.getServerSources()
  }

  @Post("server-sync/sources")
  async createServerSource(@Body() body: CreateServerSourceDto) {
    return this.instanceConfigService.createServerSource(body)
  }

  @Patch("server-sync/sources/:id")
  async updateServerSource(
    @Param("id") id: string,
    @Body() body: UpdateServerSourceDto,
  ) {
    return this.instanceConfigService.updateServerSource(id, body)
  }

  @Delete("server-sync/sources/:id")
  async deleteServerSource(@Param("id") id: string) {
    await this.instanceConfigService.deleteServerSource(id)

    return { ok: true }
  }

  @Get("session")
  async getSession() {
    return {
      ok: true,
    }
  }
}
