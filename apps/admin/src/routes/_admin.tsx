import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
  useMatches,
} from "@tanstack/react-router"
import { useEffect } from "react"
import {
  Anchor,
  AppShell,
  Box,
  Breadcrumbs,
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
    to: "/notifications",
    label: "Notifications",
    description: "Broadcast inbox messages",
  },
  {
    to: "/providers",
    label: "Providers",
    description: "Plugins & sync",
  },
  {
    to: "/covers",
    label: "Covers",
    description: "Storage usage and cleanup",
  },
  {
    to: "/server-sync",
    label: "Server Sync",
    description: "Instance-level sync support",
  },

  {
    to: "/migration",
    label: "Migration",
    description: "Database and WebDAV migrations",
  },
] as const

function AppBreadcrumbs() {
  const matches = useMatches()

  const crumbs: { label: string; to: string }[] = []

  for (const match of matches) {
    if (match.staticData.breadcrumb) {
      crumbs.push({
        label: match.staticData.breadcrumb,
        to: match.pathname,
      })
    }
  }

  const lastMatch = matches[matches.length - 1]
  if (lastMatch && !lastMatch.staticData.breadcrumb) {
    const firstParam = Object.values(lastMatch.params)[0]
    if (firstParam) {
      crumbs.push({ label: firstParam, to: lastMatch.pathname })
    }
  }

  if (crumbs.length === 0) return null

  const items = crumbs.map((crumb, index) => {
    if (index === crumbs.length - 1) {
      return (
        <Text key={crumb.to} size="sm" c="dimmed" truncate maw={200}>
          {crumb.label}
        </Text>
      )
    }

    return (
      <Anchor component={Link} to={crumb.to} key={crumb.to} size="sm">
        {crumb.label}
      </Anchor>
    )
  })

  return <Breadcrumbs mb="xs">{items}</Breadcrumbs>
}

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
          <AppBreadcrumbs />
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  )
}
