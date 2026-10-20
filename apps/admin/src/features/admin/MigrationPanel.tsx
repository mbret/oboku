import { Group, type MantineColor, Paper, Text } from "@mantine/core"
import { useMutation } from "@tanstack/react-query"
import type { ApiClient } from "@oboku/shared"
import { ConfirmButton } from "@/components/ConfirmButton"
import { apiClient } from "../apiClient"

type MigrationPanelProps<Result> = {
  title: string
  label: string
  confirmMessage: string
  color?: MantineColor
  run: (options: { client: ApiClient }) => Promise<{ data: Result }>
  describeResult: (result: Result) => string
}

export function MigrationPanel<Result>({
  title,
  label,
  confirmMessage,
  color,
  run,
  describeResult,
}: MigrationPanelProps<Result>) {
  const migration = useMutation({
    mutationFn: async () => (await run({ client: apiClient })).data,
  })

  return (
    <Paper withBorder p="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="sm" fw={500} mb="xs">
            {title}
          </Text>
          {migration.status === "idle" && (
            <Text size="sm" c="dimmed">
              No migration run yet
            </Text>
          )}
          {migration.status === "pending" && (
            <Text size="sm" c="dimmed">
              Running…
            </Text>
          )}
          {migration.status === "error" && (
            <Text size="sm" c="red">
              Error: {migration.error.message}
            </Text>
          )}
          {migration.status === "success" && (
            <Text size="sm" c="dimmed">
              Last run: {describeResult(migration.data)}
            </Text>
          )}
        </div>
        <ConfirmButton
          variant="light"
          color={color}
          loading={migration.isPending}
          confirmMessage={confirmMessage}
          onConfirm={function runMigration() {
            migration.mutate()
          }}
        >
          {label}
        </ConfirmButton>
      </Group>
    </Paper>
  )
}
