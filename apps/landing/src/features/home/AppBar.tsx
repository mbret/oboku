import Button from "@mui/material/Button"
import {
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Link as MuiLink,
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
import { NextLink } from "../common/NextLink"
import { DrawerAppBar } from "./DrawerAppBar"

export default function AppBar() {
  const drawerLinks = (
    <>
      <List>
        <ListItem disablePadding>
          <ListItemButton component={NextLink} href="/features">
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
    </>
  )

  return (
    <DrawerAppBar drawerContent={drawerLinks}>
      <MuiLink
        href="/"
        variant="h6"
        underline="none"
        color="inherit"
        sx={{ flexGrow: 1 }}
        component={NextLink}
      >
        oboku
      </MuiLink>
      <Button
        sx={{ mr: 2, display: { xs: "none", sm: "flex" } }}
        color="inherit"
        startIcon={<AutoAwesomeRounded />}
        component={NextLink}
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
    </DrawerAppBar>
  )
}
