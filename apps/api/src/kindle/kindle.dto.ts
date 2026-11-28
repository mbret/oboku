import type { SourceApiCredentials, SourceType } from "@oboku/shared"
import { IsObject, IsString } from "class-validator"

export class SendBookToKindleDto {
  @IsString()
  bookId!: string

  /** The credentials of the book's source, which the API reads the file with. */
  @IsObject()
  providerCredentials!: SourceApiCredentials<SourceType>
}

export class SendToKindleConfigDto {
  /** The address that emails the books, which a user approves in their Amazon account. */
  senderAddress!: string

  /** The largest book file a send accepts. */
  maxFileSizeBytes!: number

  /** How many books a user can send in one UTC day. */
  maxSendsPerDay!: number
}
