import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Button, Code, Group, Paper, Stack, Text } from "@mantine/core"
import {
  useServerSources,
  type ServerSource,
} from "@/features/serverSources/useServerSources"
import { useUpdateServerSource } from "@/features/serverSources/useUpdateServerSource"
import { useDeleteServerSource } from "@/features/serverSources/useDeleteServerSource"
import {
  ServerSourceFormFields,
  useServerSourceForm,
} from "@/features/serverSources/ServerSourceFormFields"
import { ConfirmButton } from "@/components/ConfirmButton"

export const Route = createFileRoute("/_admin/server-sync/$sourceId")({
  component: ServerSourceDetailPage,
})

function ServerSourceDetailPage() {
  const { sourceId } = Route.useParams()
  const serverSources = useServerSources({ enabled: true })

  const source = serverSources.data?.find((s) => s.id === sourceId)

  if (serverSources.isLoading) {
    return (
      <Text size="sm" c="dimmed">
        Loading…
      </Text>
    )
  }

  if (!source) {
    return (
      <Stack gap="md">
        <Text size="sm" c="red">
          Server source not found.
        </Text>
        <Button component={Link} to="/server-sync" variant="light">
          back to server sync
        </Button>
      </Stack>
    )
  }

  return <ServerSourceEditForm source={source} />
}

function ServerSourceEditForm({ source }: { source: ServerSource }) {
  const navigate = useNavigate()
  const updateServerSource = useUpdateServerSource()
  const deleteServerSource = useDeleteServerSource()

  const form = useServerSourceForm({
    name: source.name,
    path: source.path,
    enabled: source.enabled,
  })

  return (
    <Stack gap="md">
      <Paper withBorder p="md">
        <form
          onSubmit={form.onSubmit(async (values) => {
            await updateServerSource.mutateAsync({
              id: source.id,
              name: values.name,
              path: values.path,
              enabled: values.enabled,
            })
          })}
        >
          <Stack gap="sm">
            <Text size="sm" fw={500}>
              Edit server source
            </Text>
            <ServerSourceFormFields form={form} />

            <Group justify="space-between">
              <ConfirmButton
                color="red"
                variant="light"
                loading={deleteServerSource.isPending}
                confirmMessage={`Delete server source "${source.name}"?`}
                onConfirm={async () => {
                  await deleteServerSource.mutateAsync({ id: source.id })

                  void navigate({ to: "/server-sync" })
                }}
              >
                delete source
              </ConfirmButton>
              <Group gap="xs">
                <Button component={Link} to="/server-sync" variant="light">
                  cancel
                </Button>
                <Button type="submit" loading={updateServerSource.isPending}>
                  save changes
                </Button>
              </Group>
            </Group>
          </Stack>
        </form>
      </Paper>

      <Paper withBorder p="sm">
        <Text size="xs" c="dimmed">
          Source ID: <Code>{source.id}</Code>
        </Text>
      </Paper>
    </Stack>
  )
}
