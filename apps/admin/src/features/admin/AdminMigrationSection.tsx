import { Group, Paper, Text } from "@mantine/core"
import { useMigrateWebdavConnectors } from "../useMigrateWebdavConnectors"
import { useMigrateWebdavResourceIds } from "../useMigrateWebdavResourceIds"
import { useMigrateResourceIdToLinkData } from "../useMigrateResourceIdToLinkData"
import { useMigrateCollectionCoverKeys } from "../useMigrateCollectionCoverKeys"
import { ConfirmButton } from "@/components/ConfirmButton"

const DANGEROUS_ACTION_CONFIRMATION_MESSAGE =
  "Don't run this unless you know exactly what you're doing.\n\nThis can permanently damage your database."

export const AdminMigrationSection = () => {
  const {
    mutate: migrateWebdavConnectors,
    data: webdavMigrationResult,
    isPending: isWebdavMigrationPending,
    error: webdavMigrationError,
  } = useMigrateWebdavConnectors()
  const {
    mutate: migrateWebdavResourceIds,
    data: webdavResourceIdMigrationResult,
    isPending: isWebdavResourceIdMigrationPending,
    error: webdavResourceIdMigrationError,
  } = useMigrateWebdavResourceIds()
  const {
    mutate: migrateResourceIdToLinkData,
    data: resourceIdToLinkDataResult,
    isPending: isResourceIdToLinkDataPending,
    error: resourceIdToLinkDataError,
  } = useMigrateResourceIdToLinkData()
  const {
    mutate: migrateCollectionCoverKeys,
    data: collectionCoverKeysResult,
    isPending: isCollectionCoverKeysPending,
    error: collectionCoverKeysError,
  } = useMigrateCollectionCoverKeys()

  return (
    <>
      <Group gap="sm">
        <ConfirmButton
          variant="light"
          loading={isWebdavMigrationPending}
          confirmMessage={DANGEROUS_ACTION_CONFIRMATION_MESSAGE}
          onConfirm={() => migrateWebdavConnectors()}
        >
          migrate webdav → connectors
        </ConfirmButton>
        <ConfirmButton
          variant="light"
          loading={isWebdavResourceIdMigrationPending}
          confirmMessage={DANGEROUS_ACTION_CONFIRMATION_MESSAGE}
          onConfirm={() => migrateWebdavResourceIds()}
        >
          migrate webdav resource ids
        </ConfirmButton>
        <ConfirmButton
          variant="light"
          loading={isResourceIdToLinkDataPending}
          confirmMessage={DANGEROUS_ACTION_CONFIRMATION_MESSAGE}
          onConfirm={() => migrateResourceIdToLinkData()}
        >
          migrate resourceId → link data
        </ConfirmButton>
        <ConfirmButton
          variant="light"
          loading={isCollectionCoverKeysPending}
          confirmMessage={DANGEROUS_ACTION_CONFIRMATION_MESSAGE}
          onConfirm={() => migrateCollectionCoverKeys()}
        >
          migrate collection cover keys
        </ConfirmButton>
      </Group>
      <Paper withBorder p="md" mt="md">
        <Text size="sm" fw={500} mb="xs">
          Webdav migration
        </Text>
        {isWebdavMigrationPending && (
          <Text size="sm" c="dimmed">
            Running…
          </Text>
        )}
        {webdavMigrationError && (
          <Text size="sm" c="red">
            Error: {webdavMigrationError.message}
          </Text>
        )}
        {webdavMigrationResult && !isWebdavMigrationPending && (
          <Text size="sm" c="dimmed">
            Last run: {webdavMigrationResult.usersMigrated} user(s) migrated,{" "}
            {webdavMigrationResult.connectorsCreated} connector(s) created
          </Text>
        )}
        {!webdavMigrationResult &&
          !isWebdavMigrationPending &&
          !webdavMigrationError && (
            <Text size="sm" c="dimmed">
              No migration run yet
            </Text>
          )}
      </Paper>
      <Paper withBorder p="md" mt="md">
        <Text size="sm" fw={500} mb="xs">
          Webdav resource ID migration
        </Text>
        {isWebdavResourceIdMigrationPending && (
          <Text size="sm" c="dimmed">
            Running…
          </Text>
        )}
        {webdavResourceIdMigrationError && (
          <Text size="sm" c="red">
            Error: {webdavResourceIdMigrationError.message}
          </Text>
        )}
        {webdavResourceIdMigrationResult &&
          !isWebdavResourceIdMigrationPending && (
            <Text size="sm" c="dimmed">
              Last run: {webdavResourceIdMigrationResult.usersMigrated} user(s)
              migrated, {webdavResourceIdMigrationResult.linksUpdated} link(s)
              updated, {webdavResourceIdMigrationResult.collectionsUpdated}{" "}
              collection(s) updated
            </Text>
          )}
        {!webdavResourceIdMigrationResult &&
          !isWebdavResourceIdMigrationPending &&
          !webdavResourceIdMigrationError && (
            <Text size="sm" c="dimmed">
              No migration run yet
            </Text>
          )}
      </Paper>
      <Paper withBorder p="md" mt="md">
        <Text size="sm" fw={500} mb="xs">
          ResourceId → link data migration
        </Text>
        {isResourceIdToLinkDataPending && (
          <Text size="sm" c="dimmed">
            Running…
          </Text>
        )}
        {resourceIdToLinkDataError && (
          <Text size="sm" c="red">
            Error: {resourceIdToLinkDataError.message}
          </Text>
        )}
        {resourceIdToLinkDataResult && !isResourceIdToLinkDataPending && (
          <Text size="sm" c="dimmed">
            Last run: {resourceIdToLinkDataResult.usersMigrated} user(s)
            migrated, {resourceIdToLinkDataResult.linksUpdated} link(s) updated,{" "}
            {resourceIdToLinkDataResult.collectionsUpdated} collection(s)
            updated
          </Text>
        )}
        {!resourceIdToLinkDataResult &&
          !isResourceIdToLinkDataPending &&
          !resourceIdToLinkDataError && (
            <Text size="sm" c="dimmed">
              No migration run yet
            </Text>
          )}
      </Paper>
      <Paper withBorder p="md" mt="md">
        <Text size="sm" fw={500} mb="xs">
          Collection cover keys migration
        </Text>
        {isCollectionCoverKeysPending && (
          <Text size="sm" c="dimmed">
            Running…
          </Text>
        )}
        {collectionCoverKeysError && (
          <Text size="sm" c="red">
            Error: {collectionCoverKeysError.message}
          </Text>
        )}
        {collectionCoverKeysResult && !isCollectionCoverKeysPending && (
          <Text size="sm" c="dimmed">
            Last run: storage={collectionCoverKeysResult.storageStrategy},{" "}
            {collectionCoverKeysResult.ranOnUsers} user(s) scanned,{" "}
            {collectionCoverKeysResult.renamed} renamed,{" "}
            {collectionCoverKeysResult.skippedDestinationExists} already in
            place, {collectionCoverKeysResult.skippedSourceMissing} not found
          </Text>
        )}
        {!collectionCoverKeysResult &&
          !isCollectionCoverKeysPending &&
          !collectionCoverKeysError && (
            <Text size="sm" c="dimmed">
              No migration run yet
            </Text>
          )}
      </Paper>
    </>
  )
}
