import { memo } from "react"
import List from "@mui/material/List"
import ListItemText from "@mui/material/ListItemText"
import { DeleteForeverRounded, EditRounded } from "@mui/icons-material"
import {
  Drawer,
  Divider,
  ListItemIcon,
  ListItemButton,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import { useModalNavigationControl } from "../navigation/useModalNavigationControl"
import { setupSecretDialogSignal } from "./SetupSecretDialog"
import { useRemoveSecret } from "./useRemoveSecret"
import { notify } from "../notifications/toasts"

export const SecretActionDrawer = memo(function SecretActionDrawer({
  openWidth,
  onClose,
  masterKey,
}: {
  openWidth?: string
  onClose?: () => void
  masterKey?: string
}) {
  const { mutate: removeSecret } = useRemoveSecret({
    onSuccess: () => {
      notify("actionSuccess")
    },
  })
  const opened = !!openWidth
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const { closeModalWithNavigation } = useModalNavigationControl(
    {
      onExit: () => {
        onClose?.()
      },
    },
    openWidth,
  )

  return (
    <Drawer
      anchor={isMobile ? "bottom" : "left"}
      open={opened}
      onClose={() => closeModalWithNavigation()}
    >
      <List>
        <ListItemButton
          onClick={() => {
            closeModalWithNavigation(() => {
              setupSecretDialogSignal.update({
                openWith: openWidth ?? "-1",
                masterKey,
              })
            })
          }}
        >
          <ListItemIcon>
            <EditRounded />
          </ListItemIcon>
          <ListItemText primary="Update" />
        </ListItemButton>
      </List>
      <Divider />
      <List>
        <ListItemButton
          onClick={() => {
            const confirmed = confirm(
              "Are you sure you want to remove this secret?",
            )

            if (confirmed) {
              closeModalWithNavigation(() => {
                openWidth && removeSecret(openWidth)
              })
            }
          }}
        >
          <ListItemIcon>
            <DeleteForeverRounded />
          </ListItemIcon>
          <ListItemText primary="Remove" />
        </ListItemButton>
      </List>
    </Drawer>
  )
})
