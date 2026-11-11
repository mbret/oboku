import { IsString, MinLength } from "class-validator"

export class ConnectGoogleAccountDto {
  /** The authorization code Google's code flow popup gives the web app. */
  @IsString()
  @MinLength(1)
  code!: string
}

/** The Google account whose Drive the API reaches. Its refresh token never leaves the API. */
export class GoogleConnectionDto {
  /** The Google account's email. */
  accountName!: string
  /** When the user last connected the account. */
  connectedAt!: string
}

export class GoogleConnectionResponseDto {
  /** `null` while no Google account is connected. */
  connection!: GoogleConnectionDto | null
}
