import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import type {
  CreateAdminNotificationRequest,
  CreateAdminNotificationResponse,
  GetAdminNotificationsResponse,
  GetAdminUsersResponse,
  GetInstanceSettingsResponse,
  GetServerSyncResponse,
  SendAdminEmailRequest,
  SendAdminEmailResponse,
  SetWebDavCredentialsResponse,
  UpdateInstanceSettingsResponse,
  UpdateServerSyncResponse,
} from "@oboku/shared"
import { createHash, timingSafeEqual } from "node:crypto"
import { AuthService } from "src/auth/auth.service"
import { AdminAuthGuard, AdminPublic } from "./admin.guard"
import { AppConfigService } from "src/config/AppConfigService"
import { InstanceConfigService } from "./instance-config/instance-config.service"
import { SecretsService } from "src/config/SecretsService"
import { MigrationService } from "src/migrations/migration.service"
import { AdminCoversService } from "./admin-covers.service"
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateIf,
} from "class-validator"
import { NotificationsService } from "src/notifications/notifications.service"
import { AdminEmailService } from "./admin-email.service"
import { UserPostgresService } from "src/features/postgres/user-postgres.service"

function timingSafeStringEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest()
  const hashB = createHash("sha256").update(b).digest()

  return timingSafeEqual(hashA, hashB)
}

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

class SetWebDavCredentialsDto {
  @IsString()
  @MinLength(1)
  username!: string

  @IsString()
  @MinLength(8)
  password!: string
}

class UpdateInstanceSettingsDto {
  @IsBoolean()
  @IsOptional()
  showDisabledPlugins?: boolean

  @IsOptional()
  @ValidateIf((_object, value) => value !== "")
  @IsString()
  @MinLength(1)
  microsoftApplicationClientId?: string

  @IsOptional()
  @ValidateIf((_object, value) => value !== "")
  @IsUrl({
    require_tld: false,
    require_protocol: true,
  })
  microsoftApplicationAuthority?: string
}

class AudienceDto {
  @IsString()
  @IsIn(["all", "emails"])
  audienceType!: "all" | "emails"

  @IsArray()
  @ArrayMaxSize(1000)
  @IsEmail({}, { each: true })
  @IsOptional()
  emails?: string[]
}

class CreateAdminNotificationDto
  extends AudienceDto
  implements CreateAdminNotificationRequest
{
  @IsString()
  @MinLength(1)
  title!: string

  @IsString()
  @IsOptional()
  body?: string

  @IsString()
  @IsIn(["info", "success", "warning", "error"])
  @IsOptional()
  severity?: CreateAdminNotificationRequest["severity"]
}

class SendAdminEmailDto extends AudienceDto implements SendAdminEmailRequest {
  @IsString()
  @MinLength(1)
  subject!: string

  @IsString()
  @MinLength(1)
  body!: string
}

class SigninDto {
  @IsString()
  login!: string

  @IsString()
  password!: string
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
    private readonly migrationService: MigrationService,
    private readonly adminCoversService: AdminCoversService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationsService,
    private readonly adminEmailService: AdminEmailService,
    private readonly userPostgresService: UserPostgresService,
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
  async signin(@Body() body: SigninDto) {
    const expectedLogin = this.appConfig.ADMIN_LOGIN
    const expectedPassword = this.appConfig.ADMIN_PASSWORD

    if (!expectedLogin || !expectedPassword) {
      console.error("Admin credentials not set")

      throw new UnauthorizedException()
    }

    if (
      !timingSafeStringEqual(body.login, expectedLogin) ||
      !timingSafeStringEqual(body.password, expectedPassword)
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

  @Post("migrate-webdav-connectors")
  async migrateWebdavConnectors() {
    return this.migrationService.migrateWebdavConnectorsToConnectors()
  }

  @Post("migrate-webdav-resource-ids")
  async migrateWebdavResourceIds() {
    return this.migrationService.migrateWebdavResourceIds()
  }

  @Post("migrate-resource-id-to-link-data")
  async migrateResourceIdToLinkData() {
    return this.migrationService.migrateResourceIdToLinkData()
  }

  @Post("migrate-collection-cover-keys")
  async migrateCollectionCoverKeys() {
    return this.migrationService.migrateLegacyCollectionCoverKeys()
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

  @Get("notifications")
  async getNotifications(): Promise<GetAdminNotificationsResponse> {
    return this.notificationService.getAdminNotifications()
  }

  @Post("notifications")
  async createNotification(
    @Body() body: CreateAdminNotificationDto,
  ): Promise<CreateAdminNotificationResponse> {
    return this.notificationService.sendAdminBroadcast(body)
  }

  @Get("users")
  async getUsers(): Promise<GetAdminUsersResponse> {
    const users = await this.userPostgresService.getAllUsers()

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      emailVerified: Boolean(user.emailVerified),
      hasPassword: Boolean(user.password),
      createdAt: user.createdAt.toISOString(),
    }))
  }

  @Post("email")
  @HttpCode(202)
  async sendEmail(
    @Body() body: SendAdminEmailDto,
  ): Promise<SendAdminEmailResponse> {
    return this.adminEmailService.sendBroadcast(body)
  }

  @Get("settings")
  async getSettings(): Promise<GetInstanceSettingsResponse> {
    const config = await this.instanceConfigService.getConfig()

    return {
      showDisabledPlugins: config.showDisabledPlugins,
      microsoftApplicationClientId: config.microsoftApplicationClientId,
      microsoftApplicationAuthority: config.microsoftApplicationAuthority,
    }
  }

  @Patch("settings")
  async updateSettings(
    @Body() body: UpdateInstanceSettingsDto,
  ): Promise<UpdateInstanceSettingsResponse> {
    await this.instanceConfigService.updateConfig((prev) => ({
      ...prev,
      ...body,
    }))

    return {}
  }

  @Get("server-sync")
  async getServerSync(): Promise<GetServerSyncResponse> {
    const config = await this.instanceConfigService.getConfig()
    const { credentials } = config.serverSync

    return {
      enabled: config.serverSync.enabled,
      credentials: {
        configured: credentials !== null,
        username: credentials?.username ?? null,
      },
    }
  }

  @Patch("server-sync")
  async updateServerSync(
    @Body() body: UpdateServerSyncDto,
  ): Promise<UpdateServerSyncResponse> {
    await this.instanceConfigService.updateConfig((config) => ({
      ...config,
      serverSync: { ...config.serverSync, enabled: body.enabled },
    }))

    return { enabled: body.enabled }
  }

  @Put("server-sync/credentials")
  async setWebDavCredentials(
    @Body() body: SetWebDavCredentialsDto,
  ): Promise<SetWebDavCredentialsResponse> {
    await this.instanceConfigService.setWebDavCredentials({
      username: body.username,
      password: body.password,
    })

    return { configured: true, username: body.username }
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
