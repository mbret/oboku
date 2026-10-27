import {
  BadRequestException,
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
import { AuthService } from "../auth/auth.service.js"
import { ApiObokuErrors } from "../openapi/api-oboku-errors.decorator.js"
import { timingSafeStringEqual } from "../crypto/timingSafeStringEqual.js"
import { AdminAuthGuard, AdminPublic } from "./admin.guard.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { InstanceConfigService } from "./instance-config/instance-config.service.js"
import { formatAllowedHost, parseAllowedHost } from "../http/allowedHosts.js"
import { SecretsService } from "../config/SecretsService.js"
import { MigrationService } from "../migrations/migration.service.js"
import {
  CollectionCoverKeysMigrationResponseDto,
  RefreshTokenCreatedAtResetResponseDto,
  ResourceIdMigrationResponseDto,
  WebdavConnectorsMigrationResponseDto,
} from "../migrations/migration.dto.js"
import { AdminCoversService } from "./admin-covers.service.js"
import { NotificationsService } from "../notifications/notifications.service.js"
import {
  AdminNotificationSummaryDto,
  CreateAdminNotificationDto,
} from "../notifications/notifications.dto.js"
import { AdminEmailService } from "./admin-email.service.js"
import { AdminSecurityService } from "./admin-security.service.js"
import { UserPostgresService } from "../features/postgres/user-postgres.service.js"
import { EmptyResponseDto } from "../openapi/empty-response.dto.js"
import { OkResponseDto } from "../openapi/ok-response.dto.js"
import {
  AdminRefreshTokenDto,
  AdminSignInDto,
  AdminTokensResponseDto,
  AdminUserSummaryDto,
  CoverCleanupStatsResponseDto,
  CreateServerSourceDto,
  DeleteAllCoversResponseDto,
  GenerateSignUpLinkDto,
  InstanceSettingsResponseDto,
  RevokeTokensDto,
  RevokeTokensResponseDto,
  SendAdminEmailDto,
  SendAdminEmailResponseDto,
  ServerSourceDto,
  ServerSyncResponseDto,
  SetWebDavCredentialsDto,
  SignUpLinkResponseDto,
  TokenStatsResponseDto,
  UpdateInstanceSettingsDto,
  UpdateServerSourceDto,
  UpdateServerSyncDto,
  UpdateServerSyncResponseDto,
  WebDavCredentialsResponseDto,
} from "./admin.dto.js"

/** As `host` or `host:port`, without duplicates. */
function normalizeAllowedHosts(entries: string[]) {
  const allowedHosts = entries.map(function toAllowedHost(entry) {
    const allowedHost = parseAllowedHost(entry)

    if (!allowedHost) {
      throw new BadRequestException(
        `"${entry}" is not a host, a host:port or an http(s) URL`,
      )
    }

    return formatAllowedHost(allowedHost)
  })

  return [...new Set(allowedHosts)]
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
    private readonly adminSecurityService: AdminSecurityService,
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
  async signIn(@Body() body: AdminSignInDto): Promise<AdminTokensResponseDto> {
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
  async refreshToken(
    @Body() body: AdminRefreshTokenDto,
  ): Promise<AdminTokensResponseDto> {
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
  async migrateWebdavConnectors(): Promise<WebdavConnectorsMigrationResponseDto> {
    return this.migrationService.migrateWebdavConnectorsToConnectors()
  }

  @Post("migrate-webdav-resource-ids")
  async migrateWebdavResourceIds(): Promise<ResourceIdMigrationResponseDto> {
    return this.migrationService.migrateWebdavResourceIds()
  }

  @Post("migrate-resource-id-to-link-data")
  async migrateResourceIdToLinkData(): Promise<ResourceIdMigrationResponseDto> {
    return this.migrationService.migrateResourceIdToLinkData()
  }

  @Post("migrate-collection-cover-keys")
  async migrateCollectionCoverKeys(): Promise<CollectionCoverKeysMigrationResponseDto> {
    return this.migrationService.migrateLegacyCollectionCoverKeys()
  }

  @Post("reset-refresh-token-created-at")
  async resetRefreshTokenCreatedAt(): Promise<RefreshTokenCreatedAtResetResponseDto> {
    return this.migrationService.resetRefreshTokenCreatedAt()
  }

  @Get("covers")
  async getCoversCleanupStats(): Promise<CoverCleanupStatsResponseDto> {
    return this.adminCoversService.getCleanupStats()
  }

  @Post("covers/delete-all")
  async deleteAllCovers(): Promise<DeleteAllCoversResponseDto> {
    return this.adminCoversService.deleteAllCovers()
  }

  @ApiObokuErrors()
  @Post("signup-links")
  async generateSignUpLink(
    @Body() body: GenerateSignUpLinkDto,
  ): Promise<SignUpLinkResponseDto> {
    return {
      signUpLink: await this.authService.generateSignUpLink(body),
    }
  }

  @Get("notifications")
  async listNotifications(): Promise<AdminNotificationSummaryDto[]> {
    return this.notificationService.getAdminNotifications()
  }

  @Post("notifications")
  async createNotification(
    @Body() body: CreateAdminNotificationDto,
  ): Promise<AdminNotificationSummaryDto> {
    return this.notificationService.sendAdminBroadcast(body)
  }

  @Get("users")
  async listUsers(): Promise<AdminUserSummaryDto[]> {
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
  ): Promise<SendAdminEmailResponseDto> {
    return this.adminEmailService.sendBroadcast(body)
  }

  @Get("tokens/stats")
  async getTokenStats(): Promise<TokenStatsResponseDto> {
    return this.adminSecurityService.getTokenStats()
  }

  @Post("tokens/revoke")
  @HttpCode(200)
  async revokeTokens(
    @Body() body: RevokeTokensDto,
  ): Promise<RevokeTokensResponseDto> {
    return this.adminSecurityService.revokeTokens(body)
  }

  @Get("settings")
  getSettings(): InstanceSettingsResponseDto {
    const config = this.instanceConfigService.getConfig().value

    return {
      showDisabledPlugins: config.showDisabledPlugins,
      fileDownloadMaxSizeBytes: config.fileDownloadMaxSizeBytes,
      allowPrivateNetworkRequests: config.allowPrivateNetworkRequests,
      privateNetworkAllowedHosts: config.privateNetworkAllowedHosts,
      microsoftApplicationClientId: config.microsoftApplicationClientId,
      microsoftApplicationAuthority: config.microsoftApplicationAuthority,
    }
  }

  @Patch("settings")
  async updateSettings(
    @Body() body: UpdateInstanceSettingsDto,
  ): Promise<EmptyResponseDto> {
    const privateNetworkAllowedHosts =
      body.privateNetworkAllowedHosts &&
      normalizeAllowedHosts(body.privateNetworkAllowedHosts)

    await this.instanceConfigService.updateConfig(
      function withUpdatedSettings(config) {
        return {
          ...config,
          ...body,
          ...(privateNetworkAllowedHosts && { privateNetworkAllowedHosts }),
        }
      },
    )

    return {}
  }

  @Get("server-sync")
  getServerSync(): ServerSyncResponseDto {
    const config = this.instanceConfigService.getConfig().value
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
  ): Promise<UpdateServerSyncResponseDto> {
    await this.instanceConfigService.updateConfig((config) => ({
      ...config,
      serverSync: { ...config.serverSync, enabled: body.enabled },
    }))

    return { enabled: body.enabled }
  }

  @Put("server-sync/credentials")
  async setWebDavCredentials(
    @Body() body: SetWebDavCredentialsDto,
  ): Promise<WebDavCredentialsResponseDto> {
    await this.instanceConfigService.setWebDavCredentials({
      username: body.username,
      password: body.password,
    })

    return { configured: true, username: body.username }
  }

  @Get("server-sync/sources")
  async listServerSources(): Promise<ServerSourceDto[]> {
    return this.instanceConfigService.getServerSources()
  }

  @Post("server-sync/sources")
  async createServerSource(
    @Body() body: CreateServerSourceDto,
  ): Promise<ServerSourceDto> {
    return this.instanceConfigService.createServerSource(body)
  }

  @Patch("server-sync/sources/:id")
  async updateServerSource(
    @Param("id") id: string,
    @Body() body: UpdateServerSourceDto,
  ): Promise<ServerSourceDto> {
    return this.instanceConfigService.updateServerSource(id, body)
  }

  @Delete("server-sync/sources/:id")
  async deleteServerSource(@Param("id") id: string): Promise<OkResponseDto> {
    await this.instanceConfigService.deleteServerSource(id)

    return { ok: true }
  }

  @Get("session")
  async getSession(): Promise<OkResponseDto> {
    return {
      ok: true,
    }
  }
}
