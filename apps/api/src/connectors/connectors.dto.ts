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

  /** From the connector's URL, like `/Books`. */
  @IsString()
  path!: string

  @IsObject()
  @ValidateNested()
  @Type(() => WebdavCredentialsDto)
  providerCredentials!: WebdavCredentialsDto
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
