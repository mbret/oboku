import { type ReactNode, memo } from "react"
import {
  Badge,
  BottomNavigationAction,
  BottomNavigation,
  Box,
} from "@mui/material"
import { Link, useLocation, matchPath } from "react-router"
import { navItems } from "./navConstants"
import { OfflineIcon } from "../common/OfflineIcon"
import { ROUTES } from "./routes"
import { useUnreadNotificationsCount } from "../notifications/inbox/useUnreadNotificationsCount"

export const BottomTabBar = memo(function BottomTabBar({
  children,
}: {
  children: ReactNode
}) {
  const { pathname } = useLocation()
  const { unreadCount } = useUnreadNotificationsCount()

  const activeRoute = navItems.find(({ matchPattern }) =>
    matchPath(matchPattern, pathname),
  )?.route

  return (
    <Box
      display="flex"
      height="100%"
      flexDirection="column"
      flex={1}
      overflow="hidden"
      position="relative"
    >
      {children}
      <OfflineIcon />
      <BottomNavigation value={activeRoute}>
        {navItems.map(({ icon: Icon, route }) => (
          <BottomNavigationAction
            key={route}
            icon={
              route === ROUTES.PROFILE ? (
                <Badge badgeContent={unreadCount} color="error">
                  <Icon />
                </Badge>
              ) : (
                <Icon />
              )
            }
            value={route}
            component={Link}
            to={route}
          />
        ))}
      </BottomNavigation>
    </Box>
  )
})
