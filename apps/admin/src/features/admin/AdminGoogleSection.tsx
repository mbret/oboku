import { useEffect } from "react"
import { links } from "@oboku/shared"
import {
  Button,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { useInstanceSettings } from "../useInstanceSettings"
import { useUpdateInstanceSettings } from "../useUpdateInstanceSettings"

type AdminGoogleFormValues = {
  googleClientId: string
  googleApiKey: string
  googleClientSecret: string
}

export const AdminGoogleSection = () => {
  const instanceSettings = useInstanceSettings()
  const updateInstanceSettings = useUpdateInstanceSettings()
  const form = useForm<AdminGoogleFormValues>({
    mode: "controlled",
    initialValues: {
      googleClientId: "",
      googleApiKey: "",
      googleClientSecret: "",
    },
  })

  const savedClientId = instanceSettings.data?.googleClientId
  const savedApiKey = instanceSettings.data?.googleApiKey
  const isClientSecretConfigured =
    instanceSettings.data?.googleClientSecretConfigured ?? false

  useEffect(
    function syncFormFromInstanceSettings() {
      form.setValues({
        googleClientId: savedClientId ?? "",
        googleApiKey: savedApiKey ?? "",
        googleClientSecret: "",
      })
    },
    [savedApiKey, savedClientId, form.setValues],
  )

  const saveGoogleSettings = form.onSubmit(
    async function saveGoogleSettings(values) {
      const newClientSecret = values.googleClientSecret.trim()

      await updateInstanceSettings.mutateAsync({
        googleClientId: values.googleClientId.trim(),
        googleApiKey: values.googleApiKey.trim(),
        ...(newClientSecret && { googleClientSecret: newClientSecret }),
      })

      form.setFieldValue("googleClientSecret", "")
    },
  )

  const clearClientSecret = async () => {
    await updateInstanceSettings.mutateAsync({ googleClientSecret: "" })
  }

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <div>
          <Text size="sm" fw={500} mb="xs">
            Google
          </Text>
          <Text size="sm" c="dimmed">
            The Google Cloud OAuth client the web app uses for Google sign-in
            and Google Drive, and the API key for the Google Drive picker and
            Google Books lookups.
          </Text>
        </div>

        <div>
          <Text size="sm" fw={500} mb="xs">
            Documentation
          </Text>
          <Text size="sm" c="dimmed">
            Learn how to create the OAuth client, its secret and the API key in
            the Google Cloud console.
          </Text>
          <Group mt="sm">
            <Button
              component="a"
              href={links.documentationGoogle}
              rel="noopener noreferrer"
              target="_blank"
              variant="light"
            >
              open setup guide
            </Button>
          </Group>
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
            <form onSubmit={saveGoogleSettings}>
              <Stack gap="sm">
                <TextInput
                  label="Client ID"
                  description="Google sign-in is turned off without it."
                  placeholder="123456789012-abc.apps.googleusercontent.com"
                  autoComplete="off"
                  {...form.getInputProps("googleClientId")}
                />
                <TextInput
                  label="API key"
                  description="For the Google Drive picker and Google Books lookups."
                  autoComplete="off"
                  {...form.getInputProps("googleApiKey")}
                />
                <PasswordInput
                  label="Client secret"
                  description={
                    isClientSecretConfigured
                      ? "Configured. It is never shown again: enter a new one to replace it."
                      : "Not set."
                  }
                  autoComplete="new-password"
                  {...form.getInputProps("googleClientSecret")}
                />
                <Group justify="flex-end">
                  <Button
                    type="button"
                    variant="default"
                    disabled={!isClientSecretConfigured}
                    loading={updateInstanceSettings.isPending}
                    onClick={clearClientSecret}
                  >
                    clear client secret
                  </Button>
                  <Button
                    type="submit"
                    loading={updateInstanceSettings.isPending}
                  >
                    save Google settings
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
