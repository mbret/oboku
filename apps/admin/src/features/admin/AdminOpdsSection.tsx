import { Paper, Stack, Text } from "@mantine/core"
import { useInstanceSettings } from "../useInstanceSettings"
import { NumberSettingForm } from "./NumberSettingForm"

export const AdminOpdsSection = () => {
  const instanceSettings = useInstanceSettings()

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <div>
          <Text size="sm" fw={500} mb="xs">
            OPDS servers
          </Text>
          <Text size="sm" c="dimmed">
            Maximum number of OPDS servers each user can have. Lowering it
            deletes none of their servers.
          </Text>
        </div>

        {instanceSettings.isLoading && (
          <Text size="sm" c="dimmed">
            Loading…
          </Text>
        )}

        {instanceSettings.error && (
          <Text size="sm" c="red">
            Error: {instanceSettings.error.message}
          </Text>
        )}

        {instanceSettings.data && (
          <NumberSettingForm
            label="Maximum OPDS servers per user"
            saveLabel="save OPDS settings"
            minimumError="Must be at least 1"
            savedValue={instanceSettings.data.opdsServersMaxPerUser}
            toSettings={function toOpdsSettings(opdsServersMaxPerUser) {
              return { opdsServersMaxPerUser }
            }}
          />
        )}
      </Stack>
    </Paper>
  )
}
