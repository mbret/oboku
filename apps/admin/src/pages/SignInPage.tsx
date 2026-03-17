import {
  Box,
  Button,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { useLogin } from "@/features/useLogin"

export const SignInPage = () => {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      login: "",
      password: "",
    },
    validate: {
      login: (value) => (value.trim().length > 0 ? null : "Login is required"),
      password: (value) =>
        value.trim().length > 0 ? null : "Password is required",
    },
  })
  const {
    mutate: login,
    error: loginError,
    isPending: isLoginPending,
  } = useLogin()

  return (
    <Box
      mih="100vh"
      px="md"
      py="xl"
      display="flex"
      style={{ alignItems: "center", justifyContent: "center" }}
    >
      <Paper withBorder shadow="md" radius="md" p="xl" maw={420} w="100%">
        <Stack gap="lg">
          <div>
            <Text size="lg" fw={600}>
              Admin sign in
            </Text>
            <Text size="sm" c="dimmed" mt={4}>
              Use the admin credentials configured on the API to access
              migration, covers, and sign up tools.
            </Text>
          </div>

          <form onSubmit={form.onSubmit((values) => login(values))}>
            <Stack gap="md">
              <TextInput
                required
                label="Login"
                placeholder="admin@example.com"
                autoComplete="username"
                key={form.key("login")}
                {...form.getInputProps("login")}
              />
              <PasswordInput
                required
                label="Password"
                placeholder="Your password"
                autoComplete="current-password"
                key={form.key("password")}
                {...form.getInputProps("password")}
              />

              {loginError && (
                <Text size="sm" c="red">
                  {loginError.message}
                </Text>
              )}

              <Button
                type="submit"
                fullWidth
                radius="xl"
                loading={isLoginPending}
              >
                Sign in
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  )
}
