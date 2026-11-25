import type { SourceType, SourceApiCredentials } from "@oboku/shared"
import { IsObject, IsString } from "class-validator"

export class RunLibrarySyncDto {
  @IsString()
  dataSourceId!: string

  @IsObject()
  providerCredentials!: SourceApiCredentials<SourceType>
}
