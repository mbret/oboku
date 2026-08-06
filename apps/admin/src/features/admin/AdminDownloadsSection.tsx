import { useEffect } from "react"
import { Button, Group, NumberInput, Paper, Stack, Text } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useInstanceSettings } from "../useInstanceSettings"
import { useUpdateInstanceSettings } from "../useUpdateInstanceSettings"

const BYTES_PER_MEGABYTE = 1024 * 1024

type AdminDownloadsFormValues = {
  fileDownloadMaxSizeMb: number | string
}

export const AdminDownloadsSection = () => {
  const instanceSettings = useInstanceSettings()
  const updateInstanceSettings = useUpdateInstanceSettings()
  const form = useForm<AdminDownloadsFormValues>({
    mode: "controlled",
    initialValues: {
      fileDownloadMaxSizeMb: "",
    },
    validate: {
      fileDownloadMaxSizeMb: (value) =>
        typeof value === "number" && value >= 1
          ? null
          : "Must be at least 1 MB",
    },
  })

  const savedMaxSizeBytes = instanceSettings.data?.fileDownloadMaxSizeBytes

  useEffect(
    function syncFormFromInstanceSettings() {
      form.setValues({
        fileDownloadMaxSizeMb:
          savedMaxSizeBytes !== undefined
            ? Math.round(savedMaxSizeBytes / BYTES_PER_MEGABYTE)
            : "",
      })
    },
    [savedMaxSizeBytes, form.setValues],
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
