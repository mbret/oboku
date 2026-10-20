import { Stack } from "@mantine/core"
import {
  adminMigrateCollectionCoverKeys,
  adminMigrateResourceIdToLinkData,
  adminMigrateWebdavConnectors,
  adminMigrateWebdavResourceIds,
  adminResetRefreshTokenCreatedAt,
  type CollectionCoverKeysMigrationResponseDto,
  type RefreshTokenCreatedAtResetResponseDto,
  type ResourceIdMigrationResponseDto,
  type WebdavConnectorsMigrationResponseDto,
} from "@oboku/shared"
import { MigrationPanel } from "./MigrationPanel"

const DANGEROUS_ACTION_CONFIRMATION_MESSAGE =
  "Don't run this unless you know exactly what you're doing.\n\nThis can permanently damage your database."

const RUN_ONCE_CONFIRMATION_MESSAGE =
  "Run this EXACTLY ONCE, right after deploying the new refresh-token rotation.\n\nIt resets created_at to now() on every refresh token. Running it again extends every token by another full TTL and defeats the expiry cap."

const describeWebdavConnectorsMigration = (
  result: WebdavConnectorsMigrationResponseDto,
) =>
  `${result.usersMigrated} user(s) migrated, ${result.connectorsCreated} connector(s) created`

const describeResourceIdMigration = (result: ResourceIdMigrationResponseDto) =>
  `${result.usersMigrated} user(s) migrated, ${result.linksUpdated} link(s) updated, ${result.collectionsUpdated} collection(s) updated`

const describeCollectionCoverKeysMigration = (
  result: CollectionCoverKeysMigrationResponseDto,
) =>
  `storage=${result.storageStrategy}, ${result.ranOnUsers} user(s) scanned, ${result.renamed} renamed, ${result.skippedDestinationExists} already in place, ${result.skippedSourceMissing} not found`

const describeRefreshTokenCreatedAtReset = (
  result: RefreshTokenCreatedAtResetResponseDto,
) => `${result.updated} token(s) updated`

export const AdminMigrationSection = () => (
  <Stack gap="md">
    <MigrationPanel
      title="Webdav migration"
      label="migrate webdav → connectors"
      confirmMessage={DANGEROUS_ACTION_CONFIRMATION_MESSAGE}
      run={adminMigrateWebdavConnectors}
      describeResult={describeWebdavConnectorsMigration}
    />
    <MigrationPanel
      title="Webdav resource ID migration"
      label="migrate webdav resource ids"
      confirmMessage={DANGEROUS_ACTION_CONFIRMATION_MESSAGE}
      run={adminMigrateWebdavResourceIds}
      describeResult={describeResourceIdMigration}
    />
    <MigrationPanel
      title="ResourceId → link data migration"
      label="migrate resourceId → link data"
      confirmMessage={DANGEROUS_ACTION_CONFIRMATION_MESSAGE}
      run={adminMigrateResourceIdToLinkData}
      describeResult={describeResourceIdMigration}
    />
    <MigrationPanel
      title="Collection cover keys migration"
      label="migrate collection cover keys"
      confirmMessage={DANGEROUS_ACTION_CONFIRMATION_MESSAGE}
      run={adminMigrateCollectionCoverKeys}
      describeResult={describeCollectionCoverKeysMigration}
    />
    <MigrationPanel
      title="Refresh-token created_at reset (run once)"
      label="reset refresh-token created_at (run once)"
      confirmMessage={RUN_ONCE_CONFIRMATION_MESSAGE}
      color="red"
      run={adminResetRefreshTokenCreatedAt}
      describeResult={describeRefreshTokenCreatedAtReset}
    />
  </Stack>
)
