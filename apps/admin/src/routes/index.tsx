import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import "../App.css"
import {
  AppShell,
  Box,
  Burger,
  Group,
  NavLink,
  Stack,
  Text,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useIsAuthenticated } from "@/features/useIsAuthenticated"
import { AdminMigrationSection } from "@/features/admin/AdminMigrationSection"
import { AdminCoversSection } from "@/features/admin/AdminCoversSection"
import { AdminSignUpLinksSection } from "@/features/admin/AdminSignUpLinksSection"
import { authState } from "@/features/states"
import { authenticatedFetch } from "@/features/authenticatedFetch"
import { config } from "@/config"
import { SignInPage } from "../pages/SignInPage"

export const Route = createFileRoute("/")({
  component: App,
})

function App() {
  const [activeSection, setActiveSection] = useState<
    "migration" | "covers" | "signup-links"
  >("migration")
  const [opened, { toggle, close }] = useDisclosure(false)
  const isAuthenticated = useIsAuthenticated()

  useEffect(function checkSessionOnLoad() {
    if (!authState.value.access_token) {
      return
    }

    void authenticatedFetch(`${config.apiUrl}/admin/session`).catch(() => {})
  }, [])

  return (
    <div className="App">
      {!isAuthenticated ? <SignInPage /> : null}

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
              <NavLink
                label="Sign up links"
                description="Generate manual sign up links"
                active={activeSection === "signup-links"}
                onClick={() => {
                  setActiveSection("signup-links")
                  close()
                }}
              />
            </Stack>
          </AppShell.Navbar>

          <AppShell.Main>
            <Box maw={960}>
              {activeSection === "migration" && <AdminMigrationSection />}
              {activeSection === "covers" && <AdminCoversSection />}
              {activeSection === "signup-links" && <AdminSignUpLinksSection />}
            </Box>
          </AppShell.Main>
        </AppShell>
      )}
    </div>
  )
}
