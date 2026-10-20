import type { DataSourceType, ProviderApiCredentials } from "@oboku/shared"
import { IsObject, IsString } from "class-validator"

export class SyncDataSourceDto {
  @IsString()
  dataSourceId!: string

  @IsObject()
  providerCredentials!: ProviderApiCredentials<DataSourceType>
}
