import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { AuthUser, Public, WithAuthUser } from "src/auth/auth.guard"
import { AuthService } from "src/auth/auth.service"
import { AppConfigService } from "src/config/AppConfigService"
import { InstanceConfigService } from "src/config/instance/instance-config.service"
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

  private ensureAdmin(user: AuthUser) {
    if (user.role !== "admin") {
      throw new UnauthorizedException()
    }
  }

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
      ),
    }
  }

  @Post("migrate")
  async migrate(@WithAuthUser() user: AuthUser) {
    this.ensureAdmin(user)

    await this.couchMigrationService.migrate()
  }

  @Post("migrate-webdav-connectors")
  async migrateWebdavConnectors(@WithAuthUser() user: AuthUser) {
    this.ensureAdmin(user)

    return this.couchMigrationService.migrateWebdavConnectorsToConnectors()
  }

  @Post("migrate-webdav-resource-ids")
  async migrateWebdavResourceIds(@WithAuthUser() user: AuthUser) {
    this.ensureAdmin(user)

    return this.couchMigrationService.migrateWebdavResourceIds()
  }

  @Get("covers")
  async getCoversCleanupStats(@WithAuthUser() user: AuthUser) {
    this.ensureAdmin(user)

    return this.adminCoversService.getCleanupStats()
  }

  @Post("covers/delete-all")
  async deleteAllCovers(@WithAuthUser() user: AuthUser) {
    this.ensureAdmin(user)

    return this.adminCoversService.deleteAllCovers()
  }

  @Post("signup-links")
  async generateSignUpLink(
    @WithAuthUser() user: AuthUser,
    @Body() body: GenerateSignUpLinkDto,
  ) {
    this.ensureAdmin(user)

    return {
      signUpLink: await this.authService.generateSignUpLink(body),
    }
  }

  @Get("server-sources")
  async listServerSources(@WithAuthUser() user: AuthUser) {
    this.ensureAdmin(user)

    return this.instanceConfigService.getServerSources()
  }

  @Post("server-sources")
  async createServerSource(
    @WithAuthUser() user: AuthUser,
    @Body() body: CreateServerSourceDto,
  ) {
    this.ensureAdmin(user)

    return this.instanceConfigService.createServerSource(body)
  }

  @Patch("server-sources/:id")
  async updateServerSource(
    @WithAuthUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: UpdateServerSourceDto,
  ) {
    this.ensureAdmin(user)

    return this.instanceConfigService.updateServerSource(id, body)
  }

  @Delete("server-sources/:id")
  async deleteServerSource(
    @WithAuthUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    this.ensureAdmin(user)

    await this.instanceConfigService.deleteServerSource(id)

    return { ok: true }
  }

  @Get("session")
  async getSession(@WithAuthUser() user: AuthUser) {
    this.ensureAdmin(user)

    return {
      ok: true,
    }
  }
}
