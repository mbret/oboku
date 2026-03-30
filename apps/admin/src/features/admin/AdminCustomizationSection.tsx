import { Checkbox, Paper, Text } from "@mantine/core"
import { useInstanceSettings } from "../useInstanceSettings"
import { useUpdateInstanceSettings } from "../useUpdateInstanceSettings"

export const AdminCustomizationSection = () => {
  const { data, isLoading, error } = useInstanceSettings()
  const { mutate: updateSettings, isPending } = useUpdateInstanceSettings()

  return (
    <Paper withBorder p="md">
      <Text size="sm" fw={500} mb="xs">
        Customization
      </Text>
      {error && (
        <Text size="sm" c="red">
          Error: {error.message}
        </Text>
      )}
      {isLoading && (
        <Text size="sm" c="dimmed">
          Loading…
        </Text>
      )}
      {data && (
        <Checkbox
          label="Show non-configured providers"
          description="When enabled, providers that are not yet configured appear as disabled in the user interface"
          checked={data.showDisabledPlugins}
          disabled={isPending}
          onChange={(event) =>
            updateSettings({
              showDisabledPlugins: event.currentTarget.checked,
            })
          }
        />
      )}
    </Paper>
  )
}
