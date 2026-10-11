import { Checkbox, Paper, Stack, Text } from "@mantine/core"
import { useInstanceSettings } from "../useInstanceSettings"
import { useUpdateInstanceSettings } from "../useUpdateInstanceSettings"

export const AdminPrivateNetworksSection = () => {
  const { data, isLoading, error } = useInstanceSettings()
  const { mutate: updateSettings, isPending } = useUpdateInstanceSettings()

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <div>
          <Text size="sm" fw={500} mb="xs">
            Private networks
          </Text>
          <Text size="sm" c="dimmed">
            The server sends requests to the addresses users enter: their WebDAV
            and Synology Drive servers, the KOReader sync server they connect
            to, the links they add and the covers their collections point to. By
            default it only connects to servers on the public internet, so that
            nobody with an account can use those requests to reach your network
            or the services running next to the server. The server's own
            addresses count as private, public ones included: a request to them
            never leaves the machine.
          </Text>
        </div>

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
            label="Allow requests to private networks"
            description="For users who keep their books on your network or on this machine, on a NAS or a WebDAV server at home for instance. Only allow it when you trust everyone with an account."
            checked={data.allowPrivateNetworkRequests}
            disabled={isPending}
            onChange={function updatePrivateNetworkRequestsSetting(event) {
              updateSettings({
                allowPrivateNetworkRequests: event.currentTarget.checked,
              })
            }}
          />
        )}
      </Stack>
    </Paper>
  )
}
