import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@material-ui/core";
import { createContext, FC, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Preset = 'NOT_IMPLEMENTED' | 'OFFLINE' | 'CONFIRM' | 'UNKNOWN_ERROR'
type DialogType = {
  title?: string,
  content?: string,
  id: string,
  preset?: Preset,
  cancellable?: boolean,
  cancelTitle?: string,
  confirmTitle?: string,
  actions?: { title: string, type: 'confirm', onClick: () => void }[]
  onConfirm?: () => void,
  onClose?: () => void
  onCancel?: () => void
}

const DialogContext = createContext<DialogType[]>([])
const ManageDialogContext = createContext({
  remove: (id: string) => { },
  add: (options: Omit<DialogType, 'id'>) => '-1' as string,
})

export const useDialogManager = () => {
  const { add } = useContext(ManageDialogContext)

  return useCallback(add, [add])
}

export const ObokuDialog: FC<Omit<DialogType, 'id'> & { open: boolean }> = ({ open, cancellable, content, onConfirm, preset, title, onClose }) => {
  const dialog = useDialogManager()
  const { remove } = useContext(ManageDialogContext)

  useEffect(() => {
    let id: string | undefined

    if (open) {
      id = dialog({
        cancellable,
        content,
        onConfirm,
        preset,
        title,
        onClose,
      })
    }

    return () => {
      id && remove(id)
    }
  }, [open, cancellable, content, onConfirm, preset, title, dialog, onClose, remove])

  return null
}

const enrichDialogWithPreset = (dialog?: DialogType): DialogType | undefined => {
  if (!dialog) return undefined

  switch (dialog.preset) {
    case 'NOT_IMPLEMENTED': return {
      ...dialog,
      title: 'Not implemented',
      content: 'Sorry this feature is not yet implemented'
    }
    case 'OFFLINE': return {
      ...dialog,
      title: 'Offline is great but...',
      content: 'You need to be online to proceed with this action'
    }
    case 'UNKNOWN_ERROR': return {
      ...dialog,
      title: 'Oups, something went wrong!',
      content: 'Something unexpected happened and oboku could not proceed with your action. Maybe you can try again?'
    }
    case 'CONFIRM': return {
      ...dialog,
      title: dialog.title || 'Hold on a minute!',
      content: dialog.content || 'Are you sure you want to proceed with this action?',
      cancellable: dialog.cancellable !== undefined ? dialog.cancellable : true,
    }
    default: return dialog
  }
}

const InnerDialog = () => {
  const dialogs = useContext(DialogContext)
  const { remove } = useContext(ManageDialogContext)

  const currentDialog = enrichDialogWithPreset(dialogs[0])

  const handleClose = useCallback(() => {
    currentDialog?.onClose && currentDialog.onClose()
    if (currentDialog) {
      remove(currentDialog.id)
    }
  }, [remove, currentDialog])

  const onCancel = useCallback(() => {
    handleClose()
    currentDialog?.onCancel && currentDialog.onCancel()
  }, [handleClose, currentDialog])

  const onConfirm = useCallback(() => {
    handleClose()
    currentDialog?.onConfirm && currentDialog.onConfirm()
  }, [handleClose, currentDialog])

  const actions = currentDialog?.actions || [{
    title: currentDialog?.confirmTitle || 'Ok',
    onClick: () => { },
    type: 'confirm'
  }]

  return (
    <Dialog
      open={!!currentDialog}
      onClose={handleClose}
    >
      <DialogTitle>{currentDialog?.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {currentDialog?.content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {currentDialog?.cancellable === true && (
          <Button onClick={onCancel} color="primary">
            {currentDialog.cancelTitle || 'Cancel'}
          </Button>
        )}
        {actions.map((action, id) => (
          <Button
            key={id}
            onClick={() => {
              onConfirm()
              action.onClick()
            }}
            color="primary"
            autoFocus
          >
            {action.title}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  )
}

let generatedId = 0

/**
 * @todo use recoil or another way to not re-render all children
 * whenever dialog changes
 */
export const DialogProvider: FC<{}> = ({ children }) => {
  const [dialogs, setDialogs] = useState<DialogType[]>([])

  const remove = useCallback((id: string) => {
    setDialogs(old => old.filter((dialog) => id !== dialog.id))
  }, [])

  const add = useCallback((options: Omit<DialogType, 'id'>) => {
    generatedId++
    setDialogs(old => [...old, { ...options, id: generatedId.toString() }])

    return generatedId.toString()
  }, [])

  const controls = useMemo(() => ({
    remove,
    add,
  }), [add, remove])

  return (
    <>
      <ManageDialogContext.Provider value={controls}>
        {children}
        <DialogContext.Provider value={dialogs}>
          {dialogs.length > 0 && (
            <InnerDialog />
          )}
        </DialogContext.Provider>
      </ManageDialogContext.Provider>
    </>
  )
}