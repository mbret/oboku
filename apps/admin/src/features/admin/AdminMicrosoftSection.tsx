import { useEffect } from "react"
import { DEFAULT_MICROSOFT_APPLICATION_AUTHORITY } from "@oboku/shared"
import {
  Button,
  Code,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { useInstanceSettings } from "../useInstanceSettings"
import { useUpdateInstanceSettings } from "../useUpdateInstanceSettings"

type AdminMicrosoftFormValues = {
  microsoftApplicationClientId: string
  microsoftApplicationAuthority: string
}

export const AdminMicrosoftSection = () => {
  const instanceSettings = useInstanceSettings()
  const updateInstanceSettings = useUpdateInstanceSettings()
  const form = useForm<AdminMicrosoftFormValues>({
    mode: "controlled",
    initialValues: {
      microsoftApplicationClientId: "",
      microsoftApplicationAuthority: "",
    },
    validate: {
      microsoftApplicationAuthority: (value) => {
        const normalizedValue = value.trim()

        if (!normalizedValue) {
          return null
        }

        try {
          const url = new URL(normalizedValue)

          return url.protocol === "http:" || url.protocol === "https:"
            ? null
            : "Authority must be a valid http:// or https:// URL"
        } catch {
          return "Authority must be a valid URL"
        }
      },
    },
  })

  const savedClientId = instanceSettings.data?.microsoftApplicationClientId
  const savedAuthority = instanceSettings.data?.microsoftApplicationAuthority
  const effectiveAuthority =
    savedAuthority || DEFAULT_MICROSOFT_APPLICATION_AUTHORITY

  useEffect(
    function syncFormFromInstanceSettings() {
      form.setValues({
        microsoftApplicationClientId: savedClientId ?? "",
        microsoftApplicationAuthority: savedAuthority ?? "",
      })
    },
    [savedAuthority, savedClientId, form.setValues],
  )

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <div>
          <Text size="sm" fw={500} mb="xs">
            Microsoft
          </Text>
          <Text size="sm" c="dimmed">
            Register the Microsoft application client ID used by the web app for
            Microsoft sign-in and OneDrive access. Saving it here lets you
            manage the integration from admin instead of relying on API
            environment variables.
          </Text>
        </div>

        <div>
          <Text size="sm" fw={500} mb="xs">
            Application client ID
          </Text>
          <Text size="sm" c="dimmed">
            This is the public client identifier from your Microsoft Entra app
            registration. If nothing is saved here, the API still falls back to
            `MICROSOFT_APPLICATION_CLIENT_ID` when it is configured.
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
          <>
            <Text size="sm">
              Registered in admin:{" "}
              {savedClientId ? <Code>{savedClientId}</Code> : "Not set"}
            </Text>
            <Text size="sm">
              Auth authority: <Code>{effectiveAuthority}</Code>
            </Text>

            <form
              onSubmit={form.onSubmit(async (values) => {
                const normalizedClientId =
                  values.microsoftApplicationClientId.trim()
                const normalizedAuthority =
                  values.microsoftApplicationAuthority.trim()

                await updateInstanceSettings.mutateAsync({
                  microsoftApplicationClientId: normalizedClientId,
                  microsoftApplicationAuthority: normalizedAuthority,
                })
              })}
            >
              <Stack gap="sm">
                <TextInput
                  label="Client ID"
                  placeholder="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
                  autoComplete="off"
                  {...form.getInputProps("microsoftApplicationClientId")}
                />
                <TextInput
                  label="Auth authority"
                  description={`Defaults to ${DEFAULT_MICROSOFT_APPLICATION_AUTHORITY}`}
                  placeholder={DEFAULT_MICROSOFT_APPLICATION_AUTHORITY}
                  autoComplete="off"
                  {...form.getInputProps("microsoftApplicationAuthority")}
                />
                <Group justify="flex-end">
                  <Button
                    type="button"
                    variant="default"
                    disabled={!savedClientId && !savedAuthority}
                    loading={updateInstanceSettings.isPending}
                    onClick={async () => {
                      form.setFieldValue("microsoftApplicationClientId", "")
                      form.setFieldValue("microsoftApplicationAuthority", "")

                      await updateInstanceSettings.mutateAsync({
                        microsoftApplicationClientId: "",
                        microsoftApplicationAuthority: "",
                      })
                    }}
                  >
                    reset defaults
                  </Button>
                  <Button
                    type="submit"
                    loading={updateInstanceSettings.isPending}
                  >
                    save Microsoft settings
                  </Button>
                </Group>
              </Stack>
            </form>

            {updateInstanceSettings.error && (
              <Text size="sm" c="red">
                Error: {updateInstanceSettings.error.message}
              </Text>
            )}
          </>
        )}
      </Stack>
    </Paper>
  )
}
