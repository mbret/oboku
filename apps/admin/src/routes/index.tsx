import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import "../App.css"
import { useLogin } from "../features/useLogin"
import { useForm } from "@mantine/form"
import {
  AppShell,
  Box,
  Burger,
  Button,
  Group,
  NavLink,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useIsAuthenticated } from "@/features/useIsAuthenticated"
import { AdminMigrationSection } from "@/features/admin/AdminMigrationSection"
import { AdminCoversSection } from "@/features/admin/AdminCoversSection"

export const Route = createFileRoute("/")({
  component: App,
})

function App() {
  const [activeSection, setActiveSection] = useState<"migration" | "covers">(
    "migration",
  )
  const [opened, { toggle, close }] = useDisclosure(false)
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      login: "",
      password: "",
    },
  })
  const { mutate: login } = useLogin()
  const isAuthenticated = useIsAuthenticated()

  return (
    <div className="App">
      {!isAuthenticated ? (
        <form onSubmit={form.onSubmit((values) => login(values))}>
          <Box maw={340} mx="auto">
            <TextInput
              label="First name"
              placeholder="First name"
              key={form.key("login")}
              {...form.getInputProps("login")}
            />
            <PasswordInput
              label="Password"
              placeholder="Password"
              mt="md"
              key={form.key("password")}
              {...form.getInputProps("password")}
            />
            <Button type="submit">login</Button>
          </Box>
        </form>
      ) : null}

      {isAuthenticated && (
        <AppShell
          header={{ height: 60 }}
          navbar={{
            width: 260,
            breakpoint: "sm",
            collapsed: { mobile: !opened },
          }}
          padding="md"
          mt="md"
        >
          <AppShell.Header>
            <Group h="100%" px="md" justify="space-between">
              <Group gap="sm">
                <Burger
                  opened={opened}
                  onClick={toggle}
                  hiddenFrom="sm"
                  size="sm"
                />
                <Text fw={600}>Admin</Text>
              </Group>
              <Text size="sm" c="dimmed" visibleFrom="sm">
                Admin tools
              </Text>
            </Group>
          </AppShell.Header>

          <AppShell.Navbar p="md">
            <Stack gap="xs">
              <Text size="sm" fw={600}>
                Navigation
              </Text>
              <NavLink
                label="Migration"
                description="Database and WebDAV migrations"
                active={activeSection === "migration"}
                onClick={() => {
                  setActiveSection("migration")
                  close()
                }}
              />
              <NavLink
                label="Covers"
                description="Storage usage and cleanup"
                active={activeSection === "covers"}
                onClick={() => {
                  setActiveSection("covers")
                  close()
                }}
              />
            </Stack>
          </AppShell.Navbar>

          <AppShell.Main>
            <Box maw={960}>
              {activeSection === "migration" && <AdminMigrationSection />}
              {activeSection === "covers" && <AdminCoversSection />}
            </Box>
          </AppShell.Main>
        </AppShell>
      )}
    </div>
  )
}
