import { Paper, Stack, Text } from "@mantine/core"
import { useInstanceSettings } from "../useInstanceSettings"
import { NumberSettingForm } from "./NumberSettingForm"

const BYTES_PER_GIBIBYTE = 1024 ** 3

export function AdminQuotasSection() {
  const instanceSettings = useInstanceSettings()

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <div>
          <Text size="sm" fw={500} mb="xs">
            Quotas
          </Text>
          <Text size="sm" c="dimmed">
            Proxied downloads are files the server fetches from a provider and
            passes on to users, such as the books reading apps download from an
            OPDS server. Their quota caps what the server sends for all users
            together each month. Keep it below the monthly outbound traffic your
            host includes, with a margin for the server's other traffic.
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
            label="Proxied download quota per month (GiB)"
            saveLabel="save quota settings"
            minimumError="Must be at least 1 GiB"
            savedValue={Math.round(
              instanceSettings.data.proxiedDownloadBytesMaxPerMonth /
                BYTES_PER_GIBIBYTE,
            )}
            step={50}
            toSettings={function toQuotaSettings(gibibytes) {
              return {
                proxiedDownloadBytesMaxPerMonth: gibibytes * BYTES_PER_GIBIBYTE,
              }
            }}
          />
        )}
      </Stack>
    </Paper>
  )
}
