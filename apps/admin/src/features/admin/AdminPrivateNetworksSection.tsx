import {
  Button,
  Checkbox,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { useEffect } from "react"
import { useInstanceSettings } from "../useInstanceSettings"
import { useUpdateInstanceSettings } from "../useUpdateInstanceSettings"

const toHostLines = (hostsText: string) =>
  hostsText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")

function AllowedHostsForm({ savedHosts }: { savedHosts: string[] }) {
  const {
    mutate: updateSettings,
    isPending,
    error,
  } = useUpdateInstanceSettings()
  const form = useForm({
    mode: "controlled",
    initialValues: { hosts: "" },
  })
  const savedHostsText = savedHosts.join("\n")

  useEffect(
    function syncFormFromSavedHosts() {
      form.setValues({ hosts: savedHostsText })
    },
    [savedHostsText, form.setValues],
  )

  return (
    <form
      onSubmit={form.onSubmit(function saveAllowedHosts({ hosts }) {
        updateSettings({ privateNetworkAllowedHosts: toHostLines(hosts) })
      })}
    >
      <Stack gap="xs">
        <Textarea
          label="Allowed hosts"
          description="Reached even while private networks are refused, one per line: a host, a host:port, or a URL such as http://192.168.1.20:5005. Without a port, every service on that host is reachable."
          placeholder={"nas.local:5001\nhttp://192.168.1.20:5005"}
          autosize
          minRows={3}
          {...form.getInputProps("hosts")}
        />
        <Group justify="flex-end">
          <Button type="submit" loading={isPending}>
            save allowed hosts
          </Button>
        </Group>
        {error && (
          <Text size="sm" c="red">
            Error: {error.message}
          </Text>
        )}
      </Stack>
    </form>
  )
}

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
            and Synology Drive servers and OPDS catalogs, the KOReader sync
            server they connect to, the links they add and the covers their
            collections point to. By default it only connects to servers on the
            public internet, so that nobody with an account can use those
            requests to reach your network or the services running next to the
            server. The server's own addresses count as private, public ones
            included: a request to them never leaves the machine.
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
          <>
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
            <AllowedHostsForm savedHosts={data.privateNetworkAllowedHosts} />
          </>
        )}
      </Stack>
    </Paper>
  )
}
