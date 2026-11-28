import { Type } from "class-transformer"
import { IsObject, IsOptional, IsString, ValidateNested } from "class-validator"
import { ConnectorCredentialsDto } from "../connectors/connector-credentials.dto.js"

export class DownloadLinkDto {
  @IsString()
  linkId!: string

  /** The connector's password, for a WebDAV or OPDS link. */
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ConnectorCredentialsDto)
  providerCredentials?: ConnectorCredentialsDto
}
