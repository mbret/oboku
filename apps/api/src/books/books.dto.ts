import type { DataSourceType, ProviderApiCredentials } from "@oboku/shared"
import { IsBoolean, IsObject, IsOptional, IsString } from "class-validator"

export class RefreshBookMetadataDto {
  @IsString()
  bookId!: string

  /**
   * Hard refresh: bypass every reuse cache (file metadata, cover blob) so the
   * file is re-downloaded (when allowed) and the cover regenerated even if
   * nothing changed.
   */
  @IsBoolean()
  @IsOptional()
  force?: boolean

  @IsObject()
  providerCredentials!: ProviderApiCredentials<DataSourceType>
}
