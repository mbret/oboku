import { ApiProperty } from "@nestjs/swagger"
import {
  IsNumber,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
} from "class-validator"
import { KOREADER_SYNC_SERVABLE_DOCUMENT } from "../protocol.js"

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

/** A reading position oboku's reader pushes to the sync server. */
export class PushKoreaderSyncPositionDto {
  /** The book's KOReader document: the digest of its file. */
  // The swagger plugin documents `@Matches` only with a regex literal.
  @ApiProperty({ pattern: KOREADER_SYNC_SERVABLE_DOCUMENT.source })
  @Matches(KOREADER_SYNC_SERVABLE_DOCUMENT)
  document!: string

  /** The position in KOReader's form: an xpointer, or a page number for a book with pages. */
  @IsString()
  @MinLength(1)
  progress!: string

  /** How far into the book the position is, from 0 to 1. */
  @IsNumber()
  @Min(0)
  @Max(1)
  percentage!: number

  /** The oboku installation pushing it, sent as KOReader's `device_id`. */
  @IsString()
  @MinLength(1)
  deviceId!: string
}

/** The reading position the sync server keeps for a book. */
export class KoreaderSyncPositionDto {
  /** In KOReader's form: an xpointer, or a page number for a book with pages. */
  progress!: string
  /** How far into the book the position is, from 0 to 1. */
  percentage!: number
  /** The name of the device that pushed it, which KOReader shows. `null` when the server does not say. */
  device!: string | null
  /** The id of the device that pushed it, `null` when it sent none. */
  deviceId!: string | null
  /** When the server received it, `null` when the server does not say. */
  updatedAt!: string | null
}

export class KoreaderSyncPositionResponseDto {
  /** `null` while the server keeps no position for the book. */
  position!: KoreaderSyncPositionDto | null
}
