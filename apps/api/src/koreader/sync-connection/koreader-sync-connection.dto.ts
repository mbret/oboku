import { IsString, IsUrl, MinLength } from "class-validator"

export class ConnectKoreaderSyncServerDto {
  @IsUrl({
    require_tld: false,
    require_protocol: true,
    protocols: ["http", "https"],
  })
  serverUrl!: string

  @IsString()
  @MinLength(1)
  username!: string

  /** Sent once: the API keeps only the key sync clients derive from it. */
  @IsString()
  @MinLength(1)
  password!: string
}

/** The KOReader sync server oboku's reader syncs with. Its key never leaves the API. */
export class KoreaderSyncConnectionDto {
  serverUrl!: string
  username!: string
  /** When the user signed in to the server from oboku. */
  connectedAt!: string
}

export class KoreaderSyncConnectionResponseDto {
  /** `null` while oboku's reader is not connected to a sync server. */
  connection!: KoreaderSyncConnectionDto | null
}
