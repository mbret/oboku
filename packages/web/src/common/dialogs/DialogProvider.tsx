import { useSignalValue } from "reactjrx"
import { type DialogType, dialogSignal } from "./state"
import { removeDialog } from "./removeDialog"
import { memo, type ReactNode, useCallback } from "react"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material"

const enrichDialogWithPreset = (
  dialog?: DialogType<unknown>,
): DialogType<unknown> | undefined => {
  if (!dialog) return undefined

  switch (dialog.preset) {
    case "NOT_IMPLEMENTED":
      return {
        ...dialog,
        title: "Not implemented",
        content: "Sorry this feature is not yet implemented",
        canEscape: true,
      }
    case "OFFLINE":
      return {
        ...dialog,
        title: "Offline is great but...",
        content: "You need to be online to proceed with this action",
      }
    case "UNKNOWN_ERROR":
      return {
        title: "Oups, something went wrong!",
        content:
          "Something unexpected happened and oboku could not proceed with your action. Maybe you can try again?",
        ...dialog,
      }
    case "CONFIRM":
      return {
        ...dialog,
        title: dialog.title || "Hold on a minute!",
        content:
          dialog.content ||
          "Are you sure you want to proceed with this action?",
        cancellable:
          dialog.cancellable !== undefined ? dialog.cancellable : true,
      }
    default:
      return dialog
  }
}

const InnerDialog = () => {
  const dialogs = useSignalValue(dialogSignal)

  const currentDialog = enrichDialogWithPreset(dialogs[0])

  const handleClose = useCallback(() => {
    currentDialog?.onClose && currentDialog.onClose()
    if (currentDialog) {
      removeDialog(currentDialog.id)
    }
  }, [currentDialog])

  const onCancel = useCallback(() => {
    currentDialog?.onCancel && currentDialog.onCancel()
    handleClose()
  }, [handleClose, currentDialog])

  const actions = currentDialog?.actions || [
    {
      title: currentDialog?.confirmTitle || "Ok",
      onConfirm: currentDialog?.onConfirm,
      type: "confirm",
    },
  ]

  return (
    <Dialog
      open={!!currentDialog}
      disableEscapeKeyDown={false}
      transitionDuration={0}
      {...(currentDialog?.canEscape !== false && {
        onClose: onCancel,
        disableEscapeKeyDown: true,
      })}
    >
      <DialogTitle>{currentDialog?.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{currentDialog?.content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        {currentDialog?.cancellable === true && (
          <Button onClick={onCancel} color="primary">
            {currentDialog.cancelTitle || "Cancel"}
          </Button>
        )}
        {actions.map((action, id) => (
          <Button
            key={id}
            onClick={() => {
              action.onConfirm?.()
              handleClose()
            }}
            color="primary"
            style={{
              whiteSpace: "nowrap",
            }}
            autoFocus
          >
            {action.title}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  )
}

export const DialogProvider = memo(({ children }: { children: ReactNode }) => {
  return (
    <>
      {children}
      <InnerDialog />
    </>
  )
})
