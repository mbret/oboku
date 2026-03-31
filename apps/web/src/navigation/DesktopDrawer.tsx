import { type ReactNode, memo } from "react"
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from "@mui/material"
import { useNavigate, useLocation } from "react-router"
import { ROUTES } from "./routes"
import { navItems } from "./navConstants"
import { OfflineIcon } from "../common/OfflineIcon"

const DRAWER_WIDTH = 240

export const DesktopDrawer = memo(({ children }: { children: ReactNode }) => {
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
      flex={1}
      overflow="hidden"
      position="relative"
    >
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            minWidth: 0,
            boxSizing: "border-box",
            borderColor: "primary.main",
          },
        }}
      >
        <Toolbar />
        <List>
          {navItems.map(({ icon: Icon, label, route }) => (
            <ListItemButton
              key={route}
              selected={normalizedPath === route}
              onClick={() => navigate(route)}
            >
              <ListItemIcon>
                <Icon />
              </ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box flex={1} overflow="hidden" display="flex" flexDirection="column">
        {children}
      </Box>
      <OfflineIcon />
    </Box>
  )
})
