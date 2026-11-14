import { Paper, Stack, Text } from "@mantine/core"
import { useInstanceSettings } from "../useInstanceSettings"
import { NumberSettingForm } from "./NumberSettingForm"

const BYTES_PER_GIBIBYTE = 1024 ** 3

export function AdminStreamingSection() {
  const instanceSettings = useInstanceSettings()

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <div>
          <Text size="sm" fw={500} mb="xs">
            Streaming
          </Text>
          <Text size="sm" c="dimmed">
            Monthly cap on the data the server streams to all users together,
            such as the books reading apps download from an OPDS server. Keep it
            below the monthly outbound traffic your host includes, with a margin
            for the server's other traffic.
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
            label="Maximum streamed per month (GiB)"
            saveLabel="save streaming settings"
            minimumError="Must be at least 1 GiB"
            savedValue={Math.round(
              instanceSettings.data.streamedBytesMaxPerMonth /
                BYTES_PER_GIBIBYTE,
            )}
            step={50}
            toSettings={function toStreamingSettings(gibibytes) {
              return {
                streamedBytesMaxPerMonth: gibibytes * BYTES_PER_GIBIBYTE,
              }
            }}
          />
        )}
      </Stack>
    </Paper>
  )
}
