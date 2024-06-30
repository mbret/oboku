import { Tab, Tabs, Box, Stack } from "@mui/material"
import { Outlet, Link } from "react-router-dom"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { ROUTES } from "../constants"
import { useRouteMatch } from "../common/useRouteMatch"

export const DataSourcesTabNavigator = () => {
  // You need to provide the routes in descendant order.
  // This means that if you have nested routes like:
  // users, users/new, users/edit.
  // Then the order should be ['users/add', 'users/edit', 'users'].
  const routeMatch = useRouteMatch([
    ROUTES.DATASOURCES,
    ROUTES.DATASOURCES_LIST,
    ROUTES.DATASOURCES_REPORTS
  ])
  const currentTab =
    routeMatch?.pattern?.path === ROUTES.DATASOURCES
      ? ROUTES.DATASOURCES_LIST
      : routeMatch?.pattern?.path

  return (
    <Stack flex={1} overflow="hidden">
      <TopBarNavigation
        title="Data Sources"
        showBack={false}
        hasSearch={false}
      />
      <Tabs value={currentTab}>
        <Tab
          label="List"
          value={ROUTES.DATASOURCES_LIST}
          to={ROUTES.DATASOURCES_LIST}
          component={Link}
        />
        <Tab
          label="Reports"
          value={ROUTES.DATASOURCES_REPORTS}
          to={ROUTES.DATASOURCES_REPORTS}
          component={Link}
        />
      </Tabs>
      <Outlet />
    </Stack>
  )
}
