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
import { Link, useLocation, matchPath } from "react-router"
import { navItems } from "./navConstants"
import { OfflineIcon } from "../common/OfflineIcon"

const DRAWER_WIDTH = 240

export const DesktopDrawer = memo(function DesktopDrawer({
  children,
}: {
  children: ReactNode
}) {
  const { pathname } = useLocation()

  return (
    <Box display="flex" height="100%" flex={1} overflow="hidden">
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
          {navItems.map(({ icon: Icon, label, route, matchPattern }) => (
            <ListItemButton
              key={route}
              component={Link}
              to={route}
              selected={!!matchPath(matchPattern, pathname)}
            >
              <ListItemIcon>
                <Icon />
              </ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box
        flex={1}
        overflow="hidden"
        display="flex"
        flexDirection="column"
        position="relative"
      >
        {children}
        <OfflineIcon />
      </Box>
    </Box>
  )
})
