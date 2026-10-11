"use client"

import MenuIcon from "@mui/icons-material/Menu"
import {
  AppBar,
  Box,
  IconButton,
  styled,
  SwipeableDrawer,
  Toolbar,
  useScrollTrigger,
} from "@mui/material"
import { type ReactNode, useState } from "react"

const ScrollAwareAppBar = styled(AppBar)(function styleScrollAwareAppBar({
  theme,
}) {
  return {
    borderBottom: "1px solid transparent",
    transition: theme.transitions.create(["background-color", "border-color"], {
      duration: theme.transitions.duration.shorter,
    }),
    "&[data-page-scrolled=true]": {
      backgroundColor: theme.vars.palette.background.paper,
      borderBottomColor: theme.vars.palette.divider,
    },
  }
})

export function DrawerAppBar({
  children,
  drawerContent,
}: {
  children: ReactNode
  drawerContent: ReactNode
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const isPageScrolled = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  })

  function openDrawer() {
    setIsDrawerOpen(true)
  }

  function closeDrawer() {
    setIsDrawerOpen(false)
  }

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <ScrollAwareAppBar
          position="fixed"
          elevation={0}
          color="transparent"
          data-page-scrolled={isPageScrolled}
        >
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <IconButton
              sx={{ mr: 2, display: { xs: "flex", sm: "none" } }}
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={openDrawer}
            >
              <MenuIcon />
            </IconButton>
            {children}
          </Toolbar>
        </ScrollAwareAppBar>
      </Box>
      <SwipeableDrawer
        open={isDrawerOpen}
        onOpen={openDrawer}
        onClose={closeDrawer}
      >
        <Box sx={{ width: 250 }} role="presentation" onClick={closeDrawer}>
          {drawerContent}
        </Box>
      </SwipeableDrawer>
    </>
  )
}
