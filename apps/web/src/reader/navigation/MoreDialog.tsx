import { Dialog, DialogContent, useMediaQuery, useTheme } from "@mui/material"
import { memo, useCallback } from "react"
import { DialogHeader } from "../../common/dialogs/DialogHeader"
import { useDismissibleOverlay } from "../../navigation/modalHistory"
import { SettingsList } from "../settings/SettingsList"
import { useSetSignal, useSignalValue, virtualSignal } from "reactjrx"

const isContentsDialogOpenedStateSignal = virtualSignal<boolean>({
  key: "isContentsDialogOpenedState",
  default: false,
})

export const useOpenMoreDialog = () => {
  const update = useSetSignal(isContentsDialogOpenedStateSignal)

  return useCallback(() => update(true), [update])
}

export const MoreDialog = memo(() => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"))
  const isOpen = useSignalValue(isContentsDialogOpenedStateSignal)
  const setIsOpen = useSetSignal(isContentsDialogOpenedStateSignal)
  const { close } = useDismissibleOverlay({
    open: isOpen,
    onClose: () => setIsOpen(false),
  })

  return (
    <Dialog open={isOpen} onClose={() => close()} fullScreen={fullScreen}>
      <DialogHeader title="More" onClose={() => close()} />
      <DialogContent dividers sx={{ p: 0 }}>
        <SettingsList />
      </DialogContent>
    </Dialog>
  )
})
