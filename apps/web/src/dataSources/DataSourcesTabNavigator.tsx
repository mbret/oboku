import { Tab, Tabs, Stack } from "@mui/material"
import { Outlet, Link } from "react-router"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { useRouteMatch } from "../common/useRouteMatch"
import { ROUTES } from "../navigation/routes"

export const DataSourcesTabNavigator = () => {
  // You need to provide the routes in descendant order.
  // This means that if you have nested routes like:
  // users, users/new, users/edit.
  // Then the order should be ['users/add', 'users/edit', 'users'].
  const routeMatch = useRouteMatch([
    ROUTES.SYNC,
    ROUTES.SYNC_DATASOURCES,
    ROUTES.SYNC_REPORTS,
  ])
  const currentTab =
    routeMatch?.pattern?.path === ROUTES.SYNC
      ? ROUTES.SYNC_DATASOURCES
      : routeMatch?.pattern?.path

  return (
    <Stack flex={1} overflow="hidden">
      <TopBarNavigation title="Sync" showBack={false} hasSearch={false} />
      <Tabs value={currentTab}>
        <Tab
          label="Data sources"
          value={ROUTES.SYNC_DATASOURCES}
          to={ROUTES.SYNC_DATASOURCES}
          component={Link}
        />
        <Tab
          label="Reports"
          value={ROUTES.SYNC_REPORTS}
          to={ROUTES.SYNC_REPORTS}
          component={Link}
        />
      </Tabs>
      <Outlet />
    </Stack>
  )
}
