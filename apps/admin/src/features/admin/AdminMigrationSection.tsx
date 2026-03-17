import { Button, Group, Paper, Text } from "@mantine/core"
import { useMigrate } from "../useMigrate"
import { useMigrateWebdavConnectors } from "../useMigrateWebdavConnectors"
import { useMigrateWebdavResourceIds } from "../useMigrateWebdavResourceIds"

const DANGEROUS_ACTION_CONFIRMATION_MESSAGE =
  "Don't run this unless you know exactly what you're doing.\n\nThis can permanently damage your database."

const confirmDangerousAction = () =>
  window.confirm(DANGEROUS_ACTION_CONFIRMATION_MESSAGE)

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
        <Button
          onClick={() => {
            if (!confirmDangerousAction()) {
              return
            }

            migrate()
          }}
        >
          migrate db
        </Button>
        <Button
          onClick={() => {
            if (!confirmDangerousAction()) {
              return
            }

            migrateWebdavConnectors()
          }}
          variant="light"
          loading={isWebdavMigrationPending}
        >
          migrate webdav → connectors
        </Button>
        <Button
          onClick={() => {
            if (!confirmDangerousAction()) {
              return
            }

            migrateWebdavResourceIds()
          }}
          variant="light"
          loading={isWebdavResourceIdMigrationPending}
        >
          migrate webdav resource ids
        </Button>
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
