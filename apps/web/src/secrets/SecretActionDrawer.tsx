import { memo, useCallback } from "react"
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
import { signal, useLiveRef } from "reactjrx"
import { useModalNavigationControl } from "../navigation/useModalNavigationControl"
import { setupSecretDialogSignal } from "./SetupSecretDialog"
import { useRemoveSecret } from "./useRemoveSecret"
import { useNotifications } from "../notifications/useNofitications"

type SignalState = {
  openedWith: undefined | string
  actions?: ("removeDownload" | "goToDetails")[]
  actionsBlackList?: ("removeDownload" | "goToDetails")[]
  onDeleteBook?: () => void
}

export const bookActionDrawerSignal = signal<SignalState>({
  key: "bookActionDrawerState",
  default: { openedWith: undefined },
})

export const useBookActionDrawer = ({
  onDeleteBook,
}: {
  onDeleteBook?: () => void
} = {}) => {
  const onDeleteBookRef = useLiveRef(onDeleteBook)

  return useCallback(
    (params: Omit<SignalState, "onDeleteBook">) => {
      bookActionDrawerSignal.setValue({
        ...params,
        onDeleteBook: () => {
          onDeleteBookRef.current?.()
        },
      })
    },
    [onDeleteBookRef],
  )
}

export const SecretActionDrawer = memo(
  ({
    openWidth,
    onClose,
    masterKey,
  }: {
    openWidth?: string
    onClose?: () => void
    masterKey?: string
  }) => {
    const { notify } = useNotifications()
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
        <>
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
        </>
      </Drawer>
    )
  },
)
