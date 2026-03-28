import {
  Button,
  Checkbox,
  Code,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { useCreateServerSource } from "./useCreateServerSource"
import { useDeleteServerSource } from "./useDeleteServerSource"
import { useServerSources } from "./useServerSources"
import {
  useServerSync,
  useSetWebDavCredentials,
  useUpdateServerSync,
} from "./useServerSync"
import {
  getErrorMessage,
  ServerSourceFormFields,
  useServerSourceForm,
} from "./ServerSourceFormFields"
import { ConfirmButton } from "@/components/ConfirmButton"
import { ButtonLink } from "@/components/ButtonLink"

export const AdminServerSourcesSection = () => {
  const form = useServerSourceForm()
  const credentialsForm = useForm({
    mode: "uncontrolled",
    initialValues: { username: "", password: "" },
    validate: {
      username: (value) =>
        value.trim().length > 0 ? null : "Username is required",
      password: (value) =>
        value.length >= 8 ? null : "Password must be at least 8 characters",
    },
  })
  const serverSync = useServerSync()
  const updateServerSync = useUpdateServerSync()
  const setWebDavCredentials = useSetWebDavCredentials()
  const serverSources = useServerSources({ enabled: true })
  const createServerSource = useCreateServerSource()
  const deleteServerSource = useDeleteServerSource()

  const mutationError = createServerSource.error ?? deleteServerSource.error
  const credentialsConfigured = serverSync.data?.credentials.configured ?? false

  return (
    <Stack gap="md">
      <div>
        <Title order={3} mb="xs">
          Server Sync
        </Title>
        <Text size="sm" c="dimmed">
          Server sync works by exposing a lightweight WebDAV server. This is
          transparent for the end user and will be available through the "From
          Server" option when configuring a provider in the client app.
        </Text>
      </div>

      <Paper withBorder p="md">
        <Stack gap="sm">
          <div>
            <Text size="sm" fw={500} mb="xs">
              General
            </Text>
            <Text size="sm" c="dimmed">
              Enable or disable the WebDAV endpoint that exposes server sources
              to clients.
            </Text>
          </div>
          <Checkbox
            label="Enable server sync"
            description="Access to the WebDAV endpoint is controlled by the credentials configured below. HTTPS is strongly recommended."
            checked={serverSync.data?.enabled ?? false}
            disabled={serverSync.isLoading || updateServerSync.isPending}
            onChange={(event) => {
              updateServerSync.mutate({
                enabled: event.currentTarget.checked,
              })
            }}
          />
          {updateServerSync.error && (
            <Text size="sm" c="red">
              Error: {updateServerSync.error.message}
            </Text>
          )}
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <Stack gap="sm">
          <div>
            <Text size="sm" fw={500} mb="xs">
              Credentials
            </Text>
            <Text size="sm" c="dimmed">
              Set the username and password that WebDAV clients must provide to
              access server sources. These credentials are independent from the
              admin login.
            </Text>
          </div>

          {!serverSync.isLoading && !credentialsConfigured && (
            <Text size="sm" c="red">
              WebDAV credentials are not configured. All WebDAV requests will be
              rejected until credentials are set.
            </Text>
          )}

          {credentialsConfigured && (
            <Text size="sm">
              Current username:{" "}
              <Code>{serverSync.data?.credentials.username}</Code>
            </Text>
          )}

          <form
            onSubmit={credentialsForm.onSubmit(async (values) => {
              await setWebDavCredentials.mutateAsync(values)

              credentialsForm.reset()
            })}
          >
            <Stack gap="sm">
              <TextInput
                label="Username"
                placeholder="webdav"
                key={credentialsForm.key("username")}
                {...credentialsForm.getInputProps("username")}
              />
              <PasswordInput
                label="Password"
                description="Minimum 8 characters"
                placeholder="••••••••"
                key={credentialsForm.key("password")}
                {...credentialsForm.getInputProps("password")}
              />
              <Group justify="flex-end">
                <Button type="submit" loading={setWebDavCredentials.isPending}>
                  {credentialsConfigured
                    ? "update credentials"
                    : "save credentials"}
                </Button>
              </Group>
            </Stack>
          </form>

          {setWebDavCredentials.error && (
            <Text size="sm" c="red">
              Error: {getErrorMessage(setWebDavCredentials.error)}
            </Text>
          )}
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} mb="xs">
              Sources
            </Text>
            <Text size="sm" c="dimmed">
              Register server-side folders that can later be exposed to users as
              syncable "From Server" locations. These paths are stored in the
              instance config file, not in the database. Use the path visible to
              the API process inside the container, not the host path.
            </Text>
            <Text size="sm" c="dimmed" mt="xs">
              Example: if <Code>/mnt/books</Code> on the host is mounted to{" "}
              <Code>/library/books</Code> in Docker, save{" "}
              <Code>/library/books</Code> here.
            </Text>
          </div>

          <form
            onSubmit={form.onSubmit(async (values) => {
              await createServerSource.mutateAsync({
                name: values.name,
                path: values.path,
                enabled: values.enabled,
              })

              form.reset()
            })}
          >
            <Stack gap="sm">
              <ServerSourceFormFields form={form} />
              <Group justify="flex-end">
                <Button type="submit" loading={createServerSource.isPending}>
                  create source
                </Button>
              </Group>
            </Stack>
          </form>

          {mutationError && (
            <Text size="sm" c="red">
              Error: {getErrorMessage(mutationError)}
            </Text>
          )}
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="sm" fw={500} mb="xs">
                Registered sources
              </Text>
              <Text size="sm" c="dimmed">
                These are the server paths currently available for future sync
                providers.
              </Text>
            </div>
            <Button
              variant="light"
              onClick={() => serverSources.refetch()}
              loading={serverSources.isFetching}
            >
              refresh
            </Button>
          </Group>

          {serverSources.isLoading && (
            <Text size="sm" c="dimmed">
              Loading server sources…
            </Text>
          )}

          {serverSources.error && (
            <Text size="sm" c="red">
              Error: {serverSources.error.message}
            </Text>
          )}

          {serverSources.data?.length === 0 && !serverSources.isLoading && (
            <Text size="sm" c="dimmed">
              No server sources configured yet.
            </Text>
          )}

          {serverSources.data?.map((source) => (
            <Paper withBorder p="sm" key={source.id}>
              <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text size="sm" fw={500}>
                      {source.name}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {source.enabled ? "Enabled" : "Disabled"}
                    </Text>
                  </div>
                  <Group gap="xs">
                    <ButtonLink
                      to="/server-sync/$sourceId"
                      params={{ sourceId: source.id }}
                      variant="light"
                    >
                      edit
                    </ButtonLink>
                    <ConfirmButton
                      color="red"
                      variant="light"
                      loading={
                        deleteServerSource.isPending &&
                        deleteServerSource.variables?.id === source.id
                      }
                      confirmMessage={`Delete server source "${source.name}"?`}
                      onConfirm={async () => {
                        await deleteServerSource.mutateAsync({ id: source.id })
                      }}
                    >
                      delete
                    </ConfirmButton>
                  </Group>
                </Group>
                <Code>{source.path}</Code>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>
    </Stack>
  )
}
