import { useSignalValue } from "reactjrx"
import { type DialogTemplateType, dialogSignal } from "./state"
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

function TemplateDialog({ dialog }: { dialog?: DialogTemplateType<unknown> }) {
  const currentDialog = dialog
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

  const actions = currentDialog?.actions ?? []
  const message = currentDialog?.message

  return (
    <Dialog open={!!currentDialog} transitionDuration={0} onClose={onCancel}>
      <DialogTitle>{currentDialog?.title}</DialogTitle>
      {message !== undefined && (
        <DialogContent>
          <DialogContentText>{message}</DialogContentText>
        </DialogContent>
      )}
      <DialogActions>
        {currentDialog?.cancellable === true && (
          <Button
            onClick={onCancel}
            color="primary"
            variant={currentDialog.cancelButtonVariant ?? "text"}
            autoFocus={currentDialog.cancelButtonAutoFocus ?? false}
          >
            {currentDialog.cancelTitle || "Cancel"}
          </Button>
        )}
        {actions.map((action, id) => (
          <Button
            key={id}
            onClick={() => {
              action.onAction()
              handleClose()
            }}
            color="primary"
            variant={action.variant ?? "text"}
            style={{
              whiteSpace: "nowrap",
            }}
            autoFocus={action.autoFocus ?? true}
          >
            {action.title}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  )
}

const InnerDialog = () => {
  const dialogs = useSignalValue(dialogSignal)

  const queuedDialog = dialogs[0]

  if (queuedDialog?.type === "custom") {
    return queuedDialog.render()
  }

  return <TemplateDialog dialog={queuedDialog} />
}

export const DialogProvider = memo(function DialogProvider({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      {children}
      <InnerDialog />
    </>
  )
})
