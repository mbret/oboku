import { Type } from "class-transformer"
import { IsNotEmpty, IsObject, IsString, ValidateNested } from "class-validator"

export class WebdavCredentialsDto {
  @IsString()
  @IsNotEmpty()
  password!: string
}

export class DownloadLinkDto {
  @IsString()
  linkId!: string

  @IsObject()
  @ValidateNested()
  @Type(() => WebdavCredentialsDto)
  providerCredentials!: WebdavCredentialsDto
}
