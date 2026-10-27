export class WebdavConnectorsMigrationResponseDto {
  usersMigrated!: number
  connectorsCreated!: number
}

export class ResourceIdMigrationResponseDto {
  usersMigrated!: number
  linksUpdated!: number
  collectionsUpdated!: number
}

export class CollectionCoverKeysMigrationResponseDto {
  storageStrategy!: "fs" | "s3"
  ranOnUsers!: number
  renamed!: number
  skippedDestinationExists!: number
  skippedSourceMissing!: number
}

export class RefreshTokenCreatedAtResetResponseDto {
  updated!: number
}
