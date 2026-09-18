import { useEffect } from "react"
import {
  Button,
  Group,
  NumberInput,
  Paper,
  Stack,
  Switch,
  Text,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { useInstanceSettings } from "../useInstanceSettings"
import { useUpdateInstanceSettings } from "../useUpdateInstanceSettings"

const BYTES_PER_MEGABYTE = 1024 * 1024

type AdminDownloadsFormValues = {
  fileDownloadMaxSizeMb: number | string
  downloadProxyEnabled: boolean
  downloadProxyMaxSizeMb: number | string
}

export const AdminDownloadsSection = () => {
  const instanceSettings = useInstanceSettings()
  const updateInstanceSettings = useUpdateInstanceSettings()
  const form = useForm<AdminDownloadsFormValues>({
    mode: "controlled",
    initialValues: {
      fileDownloadMaxSizeMb: "",
      downloadProxyEnabled: false,
      downloadProxyMaxSizeMb: "",
    },
    validate: {
      fileDownloadMaxSizeMb: (value) =>
        typeof value === "number" && value >= 1
          ? null
          : "Must be at least 1 MB",
      downloadProxyMaxSizeMb: (value) =>
        typeof value === "number" && value >= 1
          ? null
          : "Must be at least 1 MB",
    },
  })

  const savedMaxSizeBytes = instanceSettings.data?.fileDownloadMaxSizeBytes
  const savedProxyEnabled = instanceSettings.data?.downloadProxyEnabled
  const savedProxyMaxSizeBytes =
    instanceSettings.data?.downloadProxyMaxSizeBytes

  useEffect(
    function syncFormFromInstanceSettings() {
      form.setValues({
        fileDownloadMaxSizeMb:
          savedMaxSizeBytes !== undefined
            ? Math.round(savedMaxSizeBytes / BYTES_PER_MEGABYTE)
            : "",
        downloadProxyEnabled: savedProxyEnabled ?? false,
        downloadProxyMaxSizeMb:
          savedProxyMaxSizeBytes !== undefined
            ? Math.round(savedProxyMaxSizeBytes / BYTES_PER_MEGABYTE)
            : "",
      })
    },
    [
      savedMaxSizeBytes,
      savedProxyEnabled,
      savedProxyMaxSizeBytes,
      form.setValues,
    ],
  )

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

        {!instanceSettings.isLoading && !instanceSettings.error && (
          <form
            onSubmit={form.onSubmit(async (values) => {
              await updateInstanceSettings.mutateAsync({
                fileDownloadMaxSizeBytes: Math.round(
                  Number(values.fileDownloadMaxSizeMb) * BYTES_PER_MEGABYTE,
                ),
                downloadProxyEnabled: values.downloadProxyEnabled,
                downloadProxyMaxSizeBytes: Math.round(
                  Number(values.downloadProxyMaxSizeMb) * BYTES_PER_MEGABYTE,
                ),
              })
            })}
          >
            <Stack gap="sm">
              <NumberInput
                label="Maximum file download size (MB)"
                min={1}
                step={50}
                allowDecimal={false}
                {...form.getInputProps("fileDownloadMaxSizeMb")}
              />
              <Switch
                label="Download books through this server"
                description="Lets users read books from providers whose server sends no CORS headers (URI, WebDAV, Synology Drive), at the cost of this server carrying the file."
                {...form.getInputProps("downloadProxyEnabled", {
                  type: "checkbox",
                })}
              />
              <NumberInput
                label="Maximum proxied download size (MB)"
                min={1}
                step={100}
                allowDecimal={false}
                disabled={!form.getValues().downloadProxyEnabled}
                {...form.getInputProps("downloadProxyMaxSizeMb")}
              />
              <Group justify="flex-end">
                <Button
                  type="submit"
                  loading={updateInstanceSettings.isPending}
                >
                  save download settings
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Stack>
    </Paper>
  )
}
