import { useEffect } from "react"
import { Button, Group, NumberInput, Paper, Stack, Text } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useInstanceSettings } from "../useInstanceSettings"
import { useUpdateInstanceSettings } from "../useUpdateInstanceSettings"

type AdminOpdsFormValues = {
  opdsServersMaxPerUser: number | string
}

export const AdminOpdsSection = () => {
  const instanceSettings = useInstanceSettings()
  const updateInstanceSettings = useUpdateInstanceSettings()
  const form = useForm<AdminOpdsFormValues>({
    mode: "controlled",
    initialValues: {
      opdsServersMaxPerUser: "",
    },
    validate: {
      opdsServersMaxPerUser: (value) =>
        typeof value === "number" && value >= 1 ? null : "Must be at least 1",
    },
  })

  const savedMaxPerUser = instanceSettings.data?.opdsServersMaxPerUser

  useEffect(
    function syncFormFromInstanceSettings() {
      form.setValues({ opdsServersMaxPerUser: savedMaxPerUser ?? "" })
    },
    [savedMaxPerUser, form.setValues],
  )

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <div>
          <Text size="sm" fw={500} mb="xs">
            OPDS servers
          </Text>
          <Text size="sm" c="dimmed">
            How many OPDS servers each user can create. Lowering it keeps the
            servers users already have.
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
                opdsServersMaxPerUser: Number(values.opdsServersMaxPerUser),
              })
            })}
          >
            <Stack gap="sm">
              <NumberInput
                label="Maximum OPDS servers per user"
                min={1}
                allowDecimal={false}
                {...form.getInputProps("opdsServersMaxPerUser")}
              />
              <Group justify="flex-end">
                <Button
                  type="submit"
                  loading={updateInstanceSettings.isPending}
                >
                  save OPDS settings
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Stack>
    </Paper>
  )
}
