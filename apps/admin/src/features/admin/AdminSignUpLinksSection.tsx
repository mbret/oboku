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
import { useGenerateSignUpLink } from "../useGenerateSignUpLink"

export const AdminSignUpLinksSection = () => {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      appPublicUrl: "",
    },
  })
  const {
    mutate: generateSignUpLink,
    data,
    error,
    isPending,
  } = useGenerateSignUpLink()

  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        <div>
          <Text size="sm" fw={500} mb="xs">
            Sign up links
          </Text>
          <Text size="sm" c="dimmed">
            Generate a sign up link manually when email sending is not
            configured. Use the app public URL field if the API does not have
            `APP_PUBLIC_URL` configured.
          </Text>
        </div>

        <form
          onSubmit={form.onSubmit((values) => {
            generateSignUpLink({
              email: values.email,
              appPublicUrl: values.appPublicUrl || undefined,
            })
          })}
        >
          <Stack gap="sm">
            <TextInput
              label="User email"
              placeholder="reader@example.com"
              key={form.key("email")}
              {...form.getInputProps("email")}
            />
            <TextInput
              label="App public URL"
              description="Optional if APP_PUBLIC_URL is configured on the API"
              placeholder="https://app.example.com"
              key={form.key("appPublicUrl")}
              {...form.getInputProps("appPublicUrl")}
            />
            <Group justify="flex-end">
              <Button type="submit" loading={isPending}>
                generate sign up link
              </Button>
            </Group>
          </Stack>
        </form>

        {data && (
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Generated link
            </Text>
            <Code block>{data.signUpLink}</Code>
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={async () => {
                  await navigator.clipboard.writeText(data.signUpLink)
                }}
              >
                copy link
              </Button>
            </Group>
          </Stack>
        )}

        {error && (
          <Text size="sm" c="red">
            Error: {error.message}
          </Text>
        )}
      </Stack>
    </Paper>
  )
}
