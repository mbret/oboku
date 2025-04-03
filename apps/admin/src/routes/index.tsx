import { createFileRoute } from "@tanstack/react-router"
import "../App.css"
import { useLogin } from "../features/useLogin"
import { useForm } from "@mantine/form"
import { Box, Button, TextInput } from "@mantine/core"
import { useIsAuthenticated } from "@/features/useIsAuthenticated"
import { useMigrate } from "@/features/useMigrate"

export const Route = createFileRoute("/")({
  component: App,
})

function App() {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      login: "",
      password: "",
    },
  })
  const { mutate: login } = useLogin()
  const isAuthenticated = useIsAuthenticated()
  const { mutate: migrate } = useMigrate()

  return (
    <div className="App">
      <form onSubmit={form.onSubmit((values) => login(values))}>
        <Box maw={340} mx="auto">
          <TextInput
            label="First name"
            placeholder="First name"
            key={form.key("login")}
            {...form.getInputProps("login")}
          />
          <TextInput
            label="Password"
            placeholder="Password"
            mt="md"
            key={form.key("password")}
            {...form.getInputProps("password")}
          />
          <Button type="submit">login</Button>
        </Box>
      </form>

      {isAuthenticated && <Button onClick={() => migrate()}>migrate db</Button>}
    </div>
  )
}
