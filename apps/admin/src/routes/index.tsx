import { createFileRoute } from "@tanstack/react-router"
import "../App.css"
import { useLogin } from "../features/useLogin"
import { useForm } from "@mantine/form"
import {
  Box,
  Button,
  Group,
  Paper,
  PasswordInput,
  Text,
  TextInput,
} from "@mantine/core"
import { useIsAuthenticated } from "@/features/useIsAuthenticated"
import { useMigrate } from "@/features/useMigrate"
import { useMigrateWebdavConnectors } from "@/features/useMigrateWebdavConnectors"
import { useMigrateWebdavResourceIds } from "@/features/useMigrateWebdavResourceIds"

export const Route = createFileRoute("/")({
  component: App,
})

const DANGEROUS_ACTION_CONFIRMATION_MESSAGE =
  "Don't run this unless you know exactly what you're doing.\n\nThis can permanently damage your database."

const confirmDangerousAction = () =>
  window.confirm(DANGEROUS_ACTION_CONFIRMATION_MESSAGE)

function App() {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      login: "",
      password: "",
    },
  })
  const { mutate: login } = useLogin()
  const isAuthenticated = useIsAuthenticated()
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
    <div className="App">
      {!isAuthenticated ? (
        <form onSubmit={form.onSubmit((values) => login(values))}>
          <Box maw={340} mx="auto">
            <TextInput
              label="First name"
              placeholder="First name"
              key={form.key("login")}
              {...form.getInputProps("login")}
            />
            <PasswordInput
              label="Password"
              placeholder="Password"
              mt="md"
              key={form.key("password")}
              {...form.getInputProps("password")}
            />
            <Button type="submit">login</Button>
          </Box>
        </form>
      ) : (
        <Paper withBorder p="md" maw={340} mx="auto">
          <Text fw={500}>Admin session active</Text>
          <Text size="sm" c="dimmed">
            You are signed in. Migration actions are available below.
          </Text>
        </Paper>
      )}

      {isAuthenticated && (
        <Box mt="md" maw={340} mx="auto">
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
                Last run: {webdavMigrationResult.usersMigrated} user(s)
                migrated, {webdavMigrationResult.connectorsCreated} connector(s)
                created
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
                  Last run: {webdavResourceIdMigrationResult.usersMigrated} user
                  (s) migrated, {webdavResourceIdMigrationResult.linksUpdated}{" "}
                  link(s) updated,{" "}
                  {webdavResourceIdMigrationResult.collectionsUpdated}{" "}
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
        </Box>
      )}
    </div>
  )
}
