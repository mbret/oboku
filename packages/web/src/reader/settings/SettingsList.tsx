import { ReplayOutlined } from "@mui/icons-material"
import {
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from "@mui/material"
import { useRecoilState } from "recoil"
import { readerSettingsState } from "./states"

export const SettingsList = () => {
  const [readerSettings, setReaderSettings] =
    useRecoilState(readerSettingsState)

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
      <ListItem
        disablePadding
        secondaryAction={
          <Checkbox
            edge="end"
            checked={readerSettings.floatingTime === "bottom"}
            disableRipple
          />
        }
      >
        <ListItemButton
          onClick={() => {
            setReaderSettings((state) => ({
              ...state,
              floatingTime:
                state.floatingTime === "bottom" ? undefined : "bottom"
            }))
          }}
        >
          <ListItemText
            primary="Show current time"
            secondary={
              "Display the current time on overlay of the book (not in comics)"
            }
          />
        </ListItemButton>
      </ListItem>
      <ListItem
        disablePadding
        secondaryAction={
          <Checkbox
            edge="end"
            checked={readerSettings.floatingProgress === "bottom"}
            disableRipple
          />
        }
      >
        <ListItemButton
          onClick={() => {
            setReaderSettings((state) => ({
              ...state,
              floatingProgress:
                state.floatingProgress === "bottom" ? undefined : "bottom"
            }))
          }}
        >
          <ListItemText
            primary="Show current progress"
            secondary={
              "Display the current book progress on overlay of the book (not in comics)"
            }
          />
        </ListItemButton>
      </ListItem>
    </List>
  )
}
