import { IsString, Matches, MaxLength, MinLength } from "class-validator"

export class OpdsServerDto {
  id!: number
  /** The server's part of its catalog URL, such as `calm-snails-dream`. Generated and unique. */
  slug!: string
  name!: string
  /** What readers sign in with as username: the account email. */
  username!: string
  createdAt!: string
}

export class OpdsServerPasswordResponseDto {
  server!: OpdsServerDto
  /** Shown once: only a hash of it is kept. */
  password!: string
}

export class RenameOpdsServerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/\S/)
  name!: string
}
