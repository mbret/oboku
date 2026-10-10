"use client"

import * as React from "react"
import MuiAppBar from "@mui/material/AppBar"
import Box from "@mui/material/Box"
import Toolbar from "@mui/material/Toolbar"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import MenuIcon from "@mui/icons-material/Menu"
import {
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Link as MuiLink,
  styled,
  SwipeableDrawer,
  useScrollTrigger,
} from "@mui/material"
import {
  AutoAwesomeRounded,
  AutoStoriesRounded,
  GitHub,
  PhoneIphoneRounded,
  Reddit,
} from "@mui/icons-material"
import { links } from "@oboku/shared"
import { DiscordMarkBlueIcon } from "../common/DiscordMarkBlueIcon"
import Link from "next/link"

const ScrollAwareAppBar = styled(MuiAppBar)(function styleScrollAwareAppBar({
  theme,
}) {
  return {
    borderBottom: "1px solid transparent",
    transition: theme.transitions.create(["background-color", "border-color"], {
      duration: theme.transitions.duration.shorter,
    }),
    "&[data-page-scrolled=true]": {
      backgroundColor: theme.palette.background.paper,
      borderBottomColor: theme.palette.divider,
    },
  }
})

export default function AppBar() {
  const [open, setOpen] = React.useState(false)
  const isPageScrolled = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  })

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen)
  }

  const DrawerList = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/features">
            <ListItemIcon>
              <AutoAwesomeRounded />
            </ListItemIcon>
            <ListItemText primary="Features" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton href={links.app} target="_blank">
            <ListItemIcon>
              <PhoneIphoneRounded />
            </ListItemIcon>
            <ListItemText primary="App" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton href={links.documentation} target="_blank">
            <ListItemIcon>
              <AutoStoriesRounded />
            </ListItemIcon>
            <ListItemText primary="Documentation" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton href={links.discord} target="_blank">
            <ListItemIcon>
              <DiscordMarkBlueIcon />
            </ListItemIcon>
            <ListItemText primary="Discord" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton href={links.github} target="_blank">
            <ListItemIcon>
              <GitHub />
            </ListItemIcon>
            <ListItemText primary="Github" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton href={links.reddit} target="_blank">
            <ListItemIcon>
              <Reddit />
            </ListItemIcon>
            <ListItemText primary="Reddit" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

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
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
            <MuiLink
              href="/"
              variant="h6"
              underline="none"
              color="inherit"
              sx={{ flexGrow: 1 }}
              component={Link}
            >
              oboku
            </MuiLink>
            <Button
              sx={{ mr: 2, display: { xs: "none", sm: "flex" } }}
              color="inherit"
              startIcon={<AutoAwesomeRounded />}
              component={Link}
              href="/features"
            >
              features
            </Button>
            <Button
              sx={{ mr: 2, display: { xs: "none", sm: "flex" } }}
              color="inherit"
              startIcon={<GitHub />}
              href={links.github}
              target="_blank"
            >
              github
            </Button>
            <Button
              sx={{ mr: 2, display: { xs: "none", sm: "flex" } }}
              color="inherit"
              // variant="contained"
              startIcon={<AutoStoriesRounded />}
              href={links.documentation}
              target="_blank"
            >
              documentation
            </Button>
            <Button
              sx={{ display: { xs: "none", sm: "flex" } }}
              color="inherit"
              size="small"
              variant="contained"
              startIcon={<PhoneIphoneRounded />}
              href={links.app}
              target="_blank"
            >
              app
            </Button>
          </Toolbar>
        </ScrollAwareAppBar>
      </Box>
      <SwipeableDrawer
        open={open}
        onOpen={toggleDrawer(true)}
        onClose={toggleDrawer(false)}
      >
        {DrawerList}
      </SwipeableDrawer>
    </>
  )
}
