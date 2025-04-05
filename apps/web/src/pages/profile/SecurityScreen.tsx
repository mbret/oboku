import { memo, useState } from "react"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import {
  alpha,
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
} from "@mui/material"
import { theme } from "../../theme/theme"
import { useSettings } from "../../settings/helpers"
import { SetupMasterPasswordDialog } from "../../secrets/SetupMasterPasswordDialog"
import { useRemoveMasterKey } from "../../secrets/useRemoveMasterKey"

export const SecurityScreen = memo(() => {
  const { data: accountSettings } = useSettings()
  const [
    isEditContentPasswordDialogOpened,
    setIsEditContentPasswordDialogOpened,
  ] = useState(false)
  const { mutate: removeMasterKey } = useRemoveMasterKey()

  return (
    <>
      <Box display="flex" flex={1} overflow="auto" flexDirection="column">
        <TopBarNavigation title={"Security"} />
        <List>
          <ListItemButton
            onClick={() => {
              setIsEditContentPasswordDialogOpened(true)
            }}
          >
            <ListItemText
              primary={
                accountSettings?.masterEncryptionKey
                  ? "Change Master Password"
                  : "Initialize my Master Password"
              }
              secondary={
                "This password is used to authorize sensitive actions, register secrets, etc."
              }
            />
          </ListItemButton>
        </List>
        <List
          subheader={
            <ListSubheader
              disableSticky
              style={{ color: theme.palette.error.dark }}
            >
              Danger zone
            </ListSubheader>
          }
          style={{ backgroundColor: alpha(theme.palette.error.light, 0.2) }}
        >
          {!!accountSettings?.masterEncryptionKey && (
            <ListItemButton
              onClick={() => {
                removeMasterKey()
              }}
            >
              <ListItemText
                primary="Remove Master Password"
                secondary="Last resort if you really lost your password"
              />
            </ListItemButton>
          )}
        </List>
      </Box>
      <SetupMasterPasswordDialog
        open={isEditContentPasswordDialogOpened}
        onClose={() => setIsEditContentPasswordDialogOpened(false)}
      />
    </>
  )
})
