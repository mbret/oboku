import {
  Button,
  Checkbox,
  Code,
  Group,
  Paper,
  Stack,
  Text,
} from "@mantine/core"
import { useCreateServerSource } from "./useCreateServerSource"
import { useDeleteServerSource } from "./useDeleteServerSource"
import { useServerSources } from "./useServerSources"
import { useServerSync, useUpdateServerSync } from "./useServerSync"
import {
  getErrorMessage,
  ServerSourceFormFields,
  useServerSourceForm,
} from "./ServerSourceFormFields"
import { ConfirmButton } from "@/components/ConfirmButton"
import { ButtonLink } from "@/components/ButtonLink"

export const AdminServerSourcesSection = () => {
  const form = useServerSourceForm()
  const serverSync = useServerSync()
  const updateServerSync = useUpdateServerSync()
  const serverSources = useServerSources({ enabled: true })
  const createServerSource = useCreateServerSource()
  const deleteServerSource = useDeleteServerSource()

  const mutationError = createServerSource.error ?? deleteServerSource.error

  return (
    <Stack gap="md">
      <Paper withBorder p="md">
        <Stack gap="sm">
          <div>
            <Text size="sm" fw={500} mb="xs">
              Server Sync
            </Text>
            <Text size="sm" c="dimmed">
              Enable or disable the WebDAV endpoint that exposes server sources
              to clients.
            </Text>
          </div>
          <Checkbox
            label="Enable server sync"
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
