import { Type } from "class-transformer"
import { IsObject, IsString, ValidateNested } from "class-validator"
import { ConnectorCredentialsDto } from "../connectors/connector-credentials.dto.js"

export class DownloadLinkDto {
  @IsString()
  linkId!: string

  @IsObject()
  @ValidateNested()
  @Type(() => ConnectorCredentialsDto)
  providerCredentials!: ConnectorCredentialsDto
}
