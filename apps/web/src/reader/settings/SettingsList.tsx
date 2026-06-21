import { ReplayOutlined } from "@mui/icons-material"
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@mui/material"
import { ReadingSettings } from "../../settings/ReadingSettings"

export const SettingsList = () => {
  return (
    <List>
      <ListItem disablePadding>
        <ListItemButton onClick={() => window.location.reload()}>
          <ListItemIcon>
            <ReplayOutlined />
          </ListItemIcon>
          <ListItemText
            primary="Reload book"
            secondary={
              "You may try to reload the book if you encounter weird behavior or crash"
            }
          />
        </ListItemButton>
      </ListItem>
      <ListSubheader sx={{ bgcolor: "transparent" }}>Reading</ListSubheader>
      <ReadingSettings />
    </List>
  )
}
