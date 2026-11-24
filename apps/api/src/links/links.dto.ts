import { Type } from "class-transformer"
import { IsObject, IsString, ValidateNested } from "class-validator"
import { WebdavCredentialsDto } from "../plugins/webdav/webdav-credentials.dto.js"

export class DownloadLinkDto {
  @IsString()
  linkId!: string

  @IsObject()
  @ValidateNested()
  @Type(() => WebdavCredentialsDto)
  providerCredentials!: WebdavCredentialsDto
}
