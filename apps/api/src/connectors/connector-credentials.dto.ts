import { IsNotEmpty, IsString } from "class-validator"

export class ConnectorCredentialsDto {
  @IsString()
  @IsNotEmpty()
  password!: string
}
