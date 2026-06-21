import { ReplayOutlined } from "@mui/icons-material"
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@mui/material"
import { useId } from "react"
import { ListItemSwitch } from "../../common/ListItemSwitch"
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
  const readerFloatingTimeId = useId()
  const readerFloatingProgressId = useId()
  const readerWakeLockEnabledId = useId()

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
      <ListItemSwitch
        primary="Show current time"
        secondary="Display the current time on overlay of the book (not in comics)"
        onClick={() => {
          localSettingsSignal.update((state) => ({
            ...state,
            readerFloatingTime:
              state.readerFloatingTime === "bottom"
                ? ("off" as const)
                : ("bottom" as const),
          }))
        }}
        checked={readerSettings.readerFloatingTime === "bottom"}
        id={readerFloatingTimeId}
      />
      <ListItemSwitch
        primary="Show current progress"
        secondary="Display the current book progress on overlay of the book (not in comics)"
        onClick={() => {
          localSettingsSignal.update((state) => ({
            ...state,
            readerFloatingProgress:
              state.readerFloatingProgress === "bottom"
                ? ("off" as const)
                : ("bottom" as const),
          }))
        }}
        checked={readerSettings.readerFloatingProgress === "bottom"}
        id={readerFloatingProgressId}
      />
      <ListItemSwitch
        primary="Keep screen on"
        secondary="Prevent the device screen from turning off while reading"
        onClick={() => {
          localSettingsSignal.update((state) => ({
            ...state,
            readerWakeLockEnabled: !readerSettings.readerWakeLockEnabled,
          }))
        }}
        checked={!!readerSettings.readerWakeLockEnabled}
        id={readerWakeLockEnabledId}
      />
    </List>
  )
}
