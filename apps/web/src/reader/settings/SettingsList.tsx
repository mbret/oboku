import { ReplayOutlined } from "@mui/icons-material"
import {
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import { localSettingsSignal } from "../../settings/useLocalSettings"
import { useSignalValue } from "reactjrx"

export const SettingsList = () => {
  const readerSettings = useSignalValue(
    localSettingsSignal,
    ({ readerFloatingProgress, readerFloatingTime }) => ({
      readerFloatingProgress,
      readerFloatingTime,
    }),
  )

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
                  ? undefined
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
                  ? undefined
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
    </List>
  )
}
