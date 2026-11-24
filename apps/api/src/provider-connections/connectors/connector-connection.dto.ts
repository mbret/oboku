import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import {
  Equals,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator"

export const CONNECTOR_CONNECTION_STATUSES = [
  "connected",
  "connector-changed",
] as const

export type ConnectorConnectionStatus =
  (typeof CONNECTOR_CONNECTION_STATUSES)[number]

/** A WebDAV connector, as the user's settings hold it. */
export class WebdavConnectorDto {
  @IsString()
  id!: string

  @Equals("webdav")
  type!: "webdav"

  @IsString()
  url!: string

  @IsString()
  username!: string

  @IsString()
  passwordAsSecretId!: string

  @IsBoolean()
  @IsOptional()
  allowSelfSigned?: boolean

  @IsBoolean()
  @IsOptional()
  proxyThroughServer?: boolean
}

/** A secret's value, encrypted with the user's master key. */
export class EncryptedSecretValueDto {
  @IsString()
  iv!: string

  @IsString()
  data!: string
}

/**
 * A connector and the value of its password secret, as the app's database
 * holds them.
 */
export class PasswordSourceDto {
  @IsObject()
  @ValidateNested()
  @Type(() => WebdavConnectorDto)
  connector!: WebdavConnectorDto

  @IsObject()
  @ValidateNested()
  @Type(() => EncryptedSecretValueDto)
  passwordSecretValue!: EncryptedSecretValueDto
}

export class ConnectConnectorDto {
  /** The connector's password, which the app decrypts from its secret. */
  @IsString()
  @MinLength(1)
  password!: string

  /**
   * What the app decrypted `password` from. The API answers 11006, without
   * signing in, unless its own copies are the same, `proxyThroughServer`
   * aside.
   */
  @IsObject()
  @ValidateNested()
  @Type(() => PasswordSourceDto)
  decryptedFrom!: PasswordSourceDto
}

/** A connector whose password the API keeps. The password never leaves the API. */
export class ConnectorConnectionDto {
  connectorId!: string
  /**
   * `connector-changed` once the connector, or its password secret's value,
   * differs from the one the user connected: the API no longer uses the
   * password until the user connects the connector again. Turning
   * `proxyThroughServer` on or off keeps the status.
   */
  @ApiProperty({ enum: CONNECTOR_CONNECTION_STATUSES })
  status!: ConnectorConnectionStatus
  /** When the user last connected the connector. */
  connectedAt!: string
}

export class ConnectorConnectionResponseDto {
  connection!: ConnectorConnectionDto
}

export class ConnectorConnectionsResponseDto {
  connections!: ConnectorConnectionDto[]
}
