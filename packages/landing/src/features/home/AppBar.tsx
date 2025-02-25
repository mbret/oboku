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
  SwipeableDrawer,
} from "@mui/material"
import {
  AutoStoriesRounded,
  GitHub,
  PhoneIphoneRounded,
  Reddit,
} from "@mui/icons-material"
import { links } from "@oboku/shared"
import { DiscordMarkBlueIcon } from "./DiscordMarkBlueIcon"
import Link from "next/link"

export default function AppBar() {
  const [open, setOpen] = React.useState(false)

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen)
  }

  const DrawerList = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
      <List>
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
        <MuiAppBar
          position="fixed"
          variant="outlined"
          elevation={0}
          color="transparent"
          style={{
            border: "none",
            backgroundColor: "white",
          }}
        >
          <Toolbar>
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
              variant="contained"
              startIcon={<PhoneIphoneRounded />}
              href={links.app}
              target="_blank"
            >
              app
            </Button>
            <Button
              sx={{ display: { xs: "none", sm: "flex" } }}
              color="inherit"
              variant="contained"
              startIcon={<AutoStoriesRounded />}
              href={links.documentation}
              target="_blank"
            >
              documentation
            </Button>
            <IconButton
              sx={{ display: { xs: "flex", sm: "none" } }}
              size="large"
              edge="end"
              aria-label="menu"
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </MuiAppBar>
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
