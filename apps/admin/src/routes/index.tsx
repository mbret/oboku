import { createFileRoute } from "@tanstack/react-router"
import "../App.css"
import { useLogin } from "../features/useLogin"
import { useForm } from "@mantine/form"
import { Box, Button, Group, Paper, Text, TextInput } from "@mantine/core"
import { useIsAuthenticated } from "@/features/useIsAuthenticated"
import { useMigrate } from "@/features/useMigrate"
import { useMigrateWebdavConnectors } from "@/features/useMigrateWebdavConnectors"

export const Route = createFileRoute("/")({
  component: App,
})

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

  return (
    <div className="App">
      <form onSubmit={form.onSubmit((values) => login(values))}>
        <Box maw={340} mx="auto">
          <TextInput
            label="First name"
            placeholder="First name"
            key={form.key("login")}
            {...form.getInputProps("login")}
          />
          <TextInput
            label="Password"
            placeholder="Password"
            mt="md"
            key={form.key("password")}
            {...form.getInputProps("password")}
          />
          <Button type="submit">login</Button>
        </Box>
      </form>

      {isAuthenticated && (
        <Box mt="md" maw={340} mx="auto">
          <Group gap="sm">
            <Button onClick={() => migrate()}>migrate db</Button>
            <Button
              onClick={() => migrateWebdavConnectors()}
              variant="light"
              loading={isWebdavMigrationPending}
            >
              migrate webdav → connectors
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
        </Box>
      )}
    </div>
  )
}
