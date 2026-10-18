import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator"
import { AudienceDto } from "../lib/audience.dto.js"

export class AdminSignInDto {
  @IsString()
  login!: string

  @IsString()
  password!: string
}

export class AdminRefreshTokenDto {
  @IsString()
  refresh_token!: string
}

export class AdminTokensResponseDto {
  access_token!: string
  refresh_token!: string
}

export class CoverCleanupStatsResponseDto {
  storageStrategy!: "fs" | "s3"
  storageLocation!: string
  storedCovers!: number | null
  storedSizeInBytes!: number | null
  canDeleteAllCovers!: boolean
}

export class FailedCoverDeletionDto {
  key!: string
  message!: string
}

export class DeleteAllCoversResponseDto {
  deletedCovers!: number
  deletedSizeInBytes!: number
  failedCovers!: number
  failedKeys!: FailedCoverDeletionDto[]
}

export class GenerateSignUpLinkDto {
  @IsEmail()
  email!: string

  @IsOptional()
  @IsUrl({
    require_tld: false,
    require_protocol: true,
  })
  appPublicUrl?: string
}

export class SignUpLinkResponseDto {
  signUpLink!: string
}

export class AdminUserSummaryDto {
  id!: number
  email!: string
  username!: string
  emailVerified!: boolean
  hasPassword!: boolean
  createdAt!: string
}

export class SendAdminEmailDto extends AudienceDto {
  @IsString()
  @MinLength(1)
  subject!: string

  @IsString()
  @MinLength(1)
  body!: string
}

export class SendAdminEmailResponseDto {
  recipientCount!: number
}

export class TokenStatsResponseDto {
  totalTokens!: number
  activeTokens!: number
  distinctUsers!: number
  distinctSessions!: number
}

export class RevokeTokensDto extends AudienceDto {}

export class RevokeTokensResponseDto {
  revokedTokens!: number
  /** Number of matched users when targeting emails; null for a full revoke. */
  targetedUsers!: number | null
}

export class InstanceSettingsResponseDto {
  showDisabledPlugins!: boolean
  fileDownloadMaxSizeBytes!: number
  allowPrivateNetworkRequests!: boolean
  privateNetworkAllowedHosts!: string[]
  microsoftApplicationClientId?: string
  microsoftApplicationAuthority?: string
}

export class UpdateInstanceSettingsDto {
  @IsBoolean()
  @IsOptional()
  showDisabledPlugins?: boolean

  @IsInt()
  @Min(1)
  @IsOptional()
  fileDownloadMaxSizeBytes?: number

  @IsBoolean()
  @IsOptional()
  allowPrivateNetworkRequests?: boolean

  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @IsOptional()
  privateNetworkAllowedHosts?: string[]

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

export class ServerSyncCredentialsDto {
  configured!: boolean
  username!: string | null
}

export class ServerSyncResponseDto {
  enabled!: boolean
  credentials!: ServerSyncCredentialsDto
}

export class UpdateServerSyncDto {
  @IsBoolean()
  enabled!: boolean
}

export class UpdateServerSyncResponseDto {
  enabled!: boolean
}

export class SetWebDavCredentialsDto {
  @IsString()
  @MinLength(1)
  username!: string

  @IsString()
  @MinLength(8)
  password!: string
}

export class WebDavCredentialsResponseDto {
  configured!: boolean
  username!: string
}

export class ServerSourceDto {
  id!: string
  name!: string
  path!: string
  enabled!: boolean
}

export class CreateServerSourceDto {
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

export class UpdateServerSourceDto {
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
