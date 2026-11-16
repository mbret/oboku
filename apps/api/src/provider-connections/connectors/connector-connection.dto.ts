import { ApiProperty } from "@nestjs/swagger"
import { IsString, MinLength } from "class-validator"

export const CONNECTOR_CONNECTION_STATUSES = [
  "connected",
  "connector-changed",
] as const

export type ConnectorConnectionStatus =
  (typeof CONNECTOR_CONNECTION_STATUSES)[number]

export class ConnectConnectorDto {
  /** The connector's password, which the app decrypts from its secret. */
  @IsString()
  @MinLength(1)
  password!: string
}

/** A connector whose password the API keeps. The password never leaves the API. */
export class ConnectorConnectionDto {
  connectorId!: string
  /**
   * `connector-changed` once the connector, or its password secret's value,
   * differs from the one the user connected: the API no longer uses the
   * password until the user connects the connector again.
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
