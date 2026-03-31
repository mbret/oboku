import { type ReactNode, memo } from "react"
import { BottomNavigationAction, BottomNavigation, Box } from "@mui/material"
import { useNavigate, useLocation } from "react-router"
import { ROUTES } from "./routes"
import { navItems } from "./navConstants"
import { OfflineIcon } from "../common/OfflineIcon"

export const BottomTabBar = memo(({ children }: { children: ReactNode }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const normalizedPath = location.pathname.startsWith(ROUTES.LIBRARY_ROOT)
    ? ROUTES.LIBRARY_BOOKS
    : location.pathname.startsWith(ROUTES.SYNC)
      ? ROUTES.SYNC
      : location.pathname

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
      <BottomNavigation
        value={normalizedPath}
        onChange={(_event, newValue) => {
          navigate(newValue)
        }}
      >
        {navItems.map(({ icon: Icon, route }) => (
          <BottomNavigationAction key={route} icon={<Icon />} value={route} />
        ))}
      </BottomNavigation>
    </Box>
  )
})
