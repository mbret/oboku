import { Paper, Stack, Text } from "@mantine/core"
import { useInstanceSettings } from "../useInstanceSettings"
import { NumberSettingForm } from "./NumberSettingForm"

const BYTES_PER_MEGABYTE = 1024 * 1024

export const AdminDownloadsSection = () => {
  const instanceSettings = useInstanceSettings()

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <div>
          <Text size="sm" fw={500} mb="xs">
            Downloads
          </Text>
          <Text size="sm" c="dimmed">
            Maximum size of a user file (book, …) the server accepts to download
            from a provider — for example when downloading a book to extract its
            embedded metadata during a refresh. Larger files are skipped.
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
            label="Maximum file download size (MB)"
            saveLabel="save download settings"
            minimumError="Must be at least 1 MB"
            savedValue={Math.round(
              instanceSettings.data.fileDownloadMaxSizeBytes /
                BYTES_PER_MEGABYTE,
            )}
            step={50}
            toSettings={function toDownloadSettings(megabytes) {
              return {
                fileDownloadMaxSizeBytes: Math.round(
                  megabytes * BYTES_PER_MEGABYTE,
                ),
              }
            }}
          />
        )}
      </Stack>
    </Paper>
  )
}
