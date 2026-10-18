import type { DataSourceType, ProviderApiCredentials } from "@oboku/shared"
import { IsBoolean, IsObject, IsOptional, IsString } from "class-validator"

export class RefreshCollectionMetadataDto {
  @IsString()
  collectionId!: string

  @IsBoolean()
  @IsOptional()
  soft?: boolean

  @IsObject()
  providerCredentials!: ProviderApiCredentials<DataSourceType>
}
