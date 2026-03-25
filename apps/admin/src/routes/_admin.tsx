import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router"
import { useEffect } from "react"
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
import { authState } from "@/features/states"
import { authenticatedFetch } from "@/features/authenticatedFetch"
import { config } from "@/config"
import { SignInPage } from "../pages/SignInPage"

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
})

const navItems = [
  {
    to: "/",
    label: "Home",
    description: "Overview",
  },
  {
    to: "/signup-links",
    label: "Sign up links",
    description: "Generate manual sign up links",
  },
  {
    to: "/covers",
    label: "Covers",
    description: "Storage usage and cleanup",
  },
  {
    to: "/server-sources",
    label: "Server sources",
    description: "Instance-level server folders",
  },

  {
    to: "/migration",
    label: "Migration",
    description: "Database and WebDAV migrations",
  },
] as const

function AdminLayout() {
  const [opened, { toggle, close }] = useDisclosure(false)
  const isAuthenticated = useIsAuthenticated()
  const { pathname } = useLocation()

  useEffect(function checkSessionOnLoad() {
    if (!authState.value.access_token) {
      return
    }

    void authenticatedFetch(`${config.apiUrl}/admin/session`).catch(() => {})
  }, [])

  if (!isAuthenticated) {
    return <SignInPage />
  }

  return (
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
            <Text
              component={Link}
              to="/"
              fw={600}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              Admin
            </Text>
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
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              component={Link}
              to={item.to}
              label={item.label}
              description={item.description}
              active={pathname === item.to}
              onClick={close}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box maw={960}>
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  )
}
