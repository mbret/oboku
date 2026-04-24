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
        dismissible: true,
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
  const isDismissible = currentDialog?.dismissible !== false

  const handleClose = useCallback(() => {
    currentDialog?.onClose?.()
    if (currentDialog) {
      removeDialog(currentDialog.id)
    }
  }, [currentDialog])

  const onCancel = useCallback(
    (_event: unknown, reason?: "backdropClick" | "escapeKeyDown") => {
      if (!isDismissible && reason === "escapeKeyDown") return
      if (!isDismissible && reason === "backdropClick") return
      currentDialog?.onCancel?.()
      handleClose()
    },
    [handleClose, currentDialog, isDismissible],
  )

  const actions = currentDialog?.actions || [
    {
      title: currentDialog?.confirmTitle || "Ok",
      onConfirm: currentDialog?.onConfirm,
      type: "confirm",
    },
  ]
  const content = currentDialog?.content

  return (
    <Dialog open={!!currentDialog} transitionDuration={0} onClose={onCancel}>
      <DialogTitle>{currentDialog?.title}</DialogTitle>
      {content !== undefined && (
        <DialogContent>
          {typeof content === "string" ? (
            <DialogContentText>{content}</DialogContentText>
          ) : (
            content
          )}
        </DialogContent>
      )}
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
