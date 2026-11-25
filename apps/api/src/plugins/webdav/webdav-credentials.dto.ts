import { IsNotEmpty, IsString } from "class-validator"

export class WebdavCredentialsDto {
  @IsString()
  @IsNotEmpty()
  password!: string
}
