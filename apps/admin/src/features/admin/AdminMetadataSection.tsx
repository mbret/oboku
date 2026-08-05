import { useEffect } from "react"
import { Button, Group, NumberInput, Paper, Stack, Text } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useInstanceSettings } from "../useInstanceSettings"
import { useUpdateInstanceSettings } from "../useUpdateInstanceSettings"

const BYTES_PER_MEGABYTE = 1024 * 1024

type AdminMetadataFormValues = {
  metadataFileDownloadMaxSizeMb: number | string
}

export const AdminMetadataSection = () => {
  const instanceSettings = useInstanceSettings()
  const updateInstanceSettings = useUpdateInstanceSettings()
  const form = useForm<AdminMetadataFormValues>({
    mode: "controlled",
    initialValues: {
      metadataFileDownloadMaxSizeMb: "",
    },
    validate: {
      metadataFileDownloadMaxSizeMb: (value) =>
        typeof value === "number" && value >= 1
          ? null
          : "Must be at least 1 MB",
    },
  })

  const savedMaxSizeBytes =
    instanceSettings.data?.metadataFileDownloadMaxSizeBytes

  useEffect(
    function syncFormFromInstanceSettings() {
      form.setValues({
        metadataFileDownloadMaxSizeMb:
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
            Metadata
          </Text>
          <Text size="sm" c="dimmed">
            When refreshing a book's metadata, the server may download the book
            file to extract embedded information (cover, authors, …). Files
            larger than this limit are not downloaded; other metadata sources
            still apply.
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
                metadataFileDownloadMaxSizeBytes: Math.round(
                  Number(values.metadataFileDownloadMaxSizeMb) *
                    BYTES_PER_MEGABYTE,
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
                {...form.getInputProps("metadataFileDownloadMaxSizeMb")}
              />
              <Group justify="flex-end">
                <Button
                  type="submit"
                  loading={updateInstanceSettings.isPending}
                >
                  save metadata settings
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Stack>
    </Paper>
  )
}
