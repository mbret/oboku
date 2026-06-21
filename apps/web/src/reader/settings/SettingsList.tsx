import { ReplayOutlined } from "@mui/icons-material"
import {
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@mui/material"
import {
  localSettingsSignal,
  useLocalSettings,
} from "../../settings/useLocalSettings"

export const SettingsList = () => {
  const readerSettings = useLocalSettings([
    "readerWakeLockEnabled",
    "readerFloatingProgress",
    "readerFloatingTime",
  ])

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
      <ListSubheader sx={{ bgcolor: "transparent" }}>Device</ListSubheader>
      <ListItem
        disablePadding
        secondaryAction={
          <Checkbox
            edge="end"
            checked={readerSettings.readerFloatingTime === "bottom"}
            disableRipple
          />
        }
      >
        <ListItemButton
          onClick={() => {
            localSettingsSignal.update((state) => ({
              ...state,
              readerFloatingTime:
                state.readerFloatingTime === "bottom"
                  ? ("off" as const)
                  : ("bottom" as const),
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
            checked={readerSettings.readerFloatingProgress === "bottom"}
            disableRipple
          />
        }
      >
        <ListItemButton
          onClick={() => {
            localSettingsSignal.update((state) => ({
              ...state,
              readerFloatingProgress:
                state.readerFloatingProgress === "bottom"
                  ? ("off" as const)
                  : ("bottom" as const),
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
      <ListItem
        disablePadding
        secondaryAction={
          <Checkbox
            edge="end"
            checked={readerSettings.readerWakeLockEnabled}
            disableRipple
          />
        }
      >
        <ListItemButton
          onClick={() => {
            localSettingsSignal.update((state) => ({
              ...state,
              readerWakeLockEnabled: !readerSettings.readerWakeLockEnabled,
            }))
          }}
        >
          <ListItemText
            primary="Keep screen on"
            secondary={
              "Prevent the device screen from turning off while reading"
            }
          />
        </ListItemButton>
      </ListItem>
    </List>
  )
}
