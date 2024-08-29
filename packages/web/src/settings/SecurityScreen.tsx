import { memo, useState } from "react"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import {
  alpha,
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader
} from "@mui/material"
import { authorizeAction } from "../auth/AuthorizeActionDialog"
import { theme } from "../theme/theme"
import { useSettings, useUpdateSettings } from "./helpers"
import { SetupContentsPasswordDialog } from "../auth/SetupContentsPasswordDialog"

export const SecurityScreen = memo(() => {
  const { data: accountSettings } = useSettings()
  const [
    isEditContentPasswordDialogOpened,
    setIsEditContentPasswordDialogOpened
  ] = useState(false)
  const { mutate: updateSettings } = useUpdateSettings()

  return (
    <>
      <Box display="flex" flex={1} overflow="scroll" flexDirection="column">
        <TopBarNavigation title={"Security"} />
        <List>
          <ListItemButton
            onClick={() => {
              if (accountSettings?.contentPassword) {
                authorizeAction(() =>
                  setIsEditContentPasswordDialogOpened(true)
                )
              } else {
                setIsEditContentPasswordDialogOpened(true)
              }
            }}
          >
            <ListItemText
              primary={
                accountSettings?.contentPassword
                  ? "Change app password"
                  : "Initialize app password (Recommended)"
              }
              secondary={
                accountSettings?.contentPassword
                  ? "Used to authorize sensitive actions"
                  : "When set, it will be used to authorize sensitive actions"
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
          {!!accountSettings?.contentPassword && (
            <ListItemButton
              onClick={() => {
                authorizeAction(() => {
                  updateSettings({
                    contentPassword: null
                  })
                })
              }}
            >
              <ListItemText primary="Remove app password" />
            </ListItemButton>
          )}
        </List>
      </Box>
      <SetupContentsPasswordDialog
        open={isEditContentPasswordDialogOpened}
        onClose={() => setIsEditContentPasswordDialogOpened(false)}
      />
    </>
  )
})
