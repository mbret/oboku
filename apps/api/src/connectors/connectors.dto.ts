import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsObject, IsString, ValidateNested } from "class-validator"
import { WebdavCredentialsDto } from "../links/links.dto.js"

export const WEBDAV_DIRECTORY_ITEM_TYPES = ["file", "directory"] as const

export type WebdavDirectoryItemType =
  (typeof WEBDAV_DIRECTORY_ITEM_TYPES)[number]

export class ListWebdavDirectoryDto {
  @IsString()
  connectorId!: string

  /** The directory to list, from the root of the connector's server. */
  @IsString()
  path!: string

  @IsObject()
  @ValidateNested()
  @Type(() => WebdavCredentialsDto)
  providerCredentials!: WebdavCredentialsDto
}

/** A file or a directory, as the WebDAV server describes it. */
export class WebdavDirectoryItemDto {
  /** The item's path from the root of the server. */
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
