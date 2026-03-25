import { Group, Paper, Text } from "@mantine/core"
import { useMigrate } from "../useMigrate"
import { useMigrateWebdavConnectors } from "../useMigrateWebdavConnectors"
import { useMigrateWebdavResourceIds } from "../useMigrateWebdavResourceIds"
import { ConfirmButton } from "@/components/ConfirmButton"

const DANGEROUS_ACTION_CONFIRMATION_MESSAGE =
  "Don't run this unless you know exactly what you're doing.\n\nThis can permanently damage your database."

export const AdminMigrationSection = () => {
  const { mutate: migrate } = useMigrate()
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

  return (
    <>
      <Group gap="sm">
        <ConfirmButton
          confirmMessage={DANGEROUS_ACTION_CONFIRMATION_MESSAGE}
          onConfirm={() => migrate()}
        >
          migrate db
        </ConfirmButton>
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
    </>
  )
}
