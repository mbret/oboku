import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@material-ui/core";
import { createContext, FC, useCallback, useContext, useMemo, useState } from "react";

type Preset = 'NOT_IMPLEMENTED'
type DialogType = { title?: string, content?: string, id: string, preset?: Preset }

const DialogContext = createContext<DialogType[]>([])
const ManageDialogContext = createContext({
  remove: (id: string) => { },
  add: (options: { title?: string, content?: string, preset?: Preset }) => { },
})

export const useDialog = () => {
  const { add } = useContext(ManageDialogContext)

  return useCallback(add, [add])
}

const enrichDialogWithPreset = (dialog?: DialogType) => {
  if (!dialog) return undefined

  switch (dialog.preset) {
    case 'NOT_IMPLEMENTED': return {
      ...dialog,
      title: 'Not implemented',
      content: 'Sorry this feature is not yet implemented'
    }
    default: return dialog
  }
}

const InnerDialog = () => {
  const dialogs = useContext(DialogContext)
  const { remove } = useContext(ManageDialogContext)

  const currentDialog = enrichDialogWithPreset(dialogs[0])

  const handleClose = () => {
    if (currentDialog) {
      remove(currentDialog.id)
    }
  }

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
        {/* <Button onClick={handleClose} color="primary">
          Disagree
          </Button> */}
        <Button onClick={handleClose} color="primary" autoFocus>
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  )
}

let id = 0

/**
 * @todo use recoil or another way to not re-render all children
 * whenever dialog changes
 */
export const DialogProvider: FC<{}> = ({ children }) => {
  const [dialogs, setDialogs] = useState<DialogType[]>([])

  const remove = useCallback((id: string) => {
    setDialogs(old => old.filter((dialog) => id !== dialog.id))
  }, [])

  const add = useCallback((options: { title?: string, content?: string, preset?: Preset }) => {
    id++
    setDialogs(old => [...old, { ...options, id: id.toString() }])
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