import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from "class-validator"
import { WebdavCredentialsDto } from "../plugins/webdav/webdav-credentials.dto.js"

export const WEBDAV_DIRECTORY_ITEM_TYPES = ["file", "directory"] as const

export type WebdavDirectoryItemType =
  (typeof WEBDAV_DIRECTORY_ITEM_TYPES)[number]

export class ListWebdavDirectoryDto {
  /** An http or https URL. */
  @IsString()
  @Matches(/^https?:\/\//i)
  url!: string

  @IsString()
  username!: string

  @IsObject()
  @ValidateNested()
  @Type(() => WebdavCredentialsDto)
  providerCredentials!: WebdavCredentialsDto

  @IsOptional()
  @IsBoolean()
  allowSelfSigned?: boolean

  /** Relative to `url`, like `/Books`. */
  @IsString()
  path!: string
}

export class WebdavDirectoryItemDto {
  /** The item's path from the connector's URL. */
  filename!: string
  basename!: string
  @ApiProperty({ enum: WEBDAV_DIRECTORY_ITEM_TYPES })
  type!: WebdavDirectoryItemType
  mime?: string
  etag?: string
}

export class WebdavDirectoryResponseDto {
  items!: WebdavDirectoryItemDto[]
}
