import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from "@mui/material"
import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react"
import { signal } from "reactjrx"

type Preset = "NOT_IMPLEMENTED" | "OFFLINE" | "CONFIRM" | "UNKNOWN_ERROR"

type DialogType = {
  title?: string
  content?: string
  id: string
  preset?: Preset
  cancellable?: boolean
  canEscape?: boolean
  cancelTitle?: string
  confirmTitle?: string
  actions?: { title: string; type: "confirm"; onClick: () => void }[]
  onConfirm?: () => void
  onClose?: () => void
  onCancel?: () => void
}

const dialogUpdateSignal = signal<{ id: string; state: "closed" } | undefined>(
  {}
)

const DialogContext = createContext<DialogType[]>([])

const ManageDialogContext = createContext({
  remove: (id: string) => {},
  add: (options: Omit<DialogType, "id">) => ({
    id: "-1" as string,
    promise: Promise.resolve()
  })
})

export const useDialogManager = () => {
  const { add } = useContext(ManageDialogContext)

  return useCallback(add, [add])
}

const enrichDialogWithPreset = (
  dialog?: DialogType
): DialogType | undefined => {
  if (!dialog) return undefined

  switch (dialog.preset) {
    case "NOT_IMPLEMENTED":
      return {
        ...dialog,
        title: "Not implemented",
        content: "Sorry this feature is not yet implemented",
        canEscape: true
      }
    case "OFFLINE":
      return {
        ...dialog,
        title: "Offline is great but...",
        content: "You need to be online to proceed with this action"
      }
    case "UNKNOWN_ERROR":
      return {
        title: "Oups, something went wrong!",
        content:
          "Something unexpected happened and oboku could not proceed with your action. Maybe you can try again?",
        ...dialog
      }
    case "CONFIRM":
      return {
        ...dialog,
        title: dialog.title || "Hold on a minute!",
        content:
          dialog.content ||
          "Are you sure you want to proceed with this action?",
        cancellable:
          dialog.cancellable !== undefined ? dialog.cancellable : true
      }
    default:
      return dialog
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

  const actions = currentDialog?.actions || [
    {
      title: currentDialog?.confirmTitle || "Ok",
      onClick: () => {},
      type: "confirm"
    }
  ]

  return (
    <Dialog
      open={!!currentDialog}
      disableEscapeKeyDown={false}
      {...(currentDialog?.canEscape !== false && {
        onClose: onCancel,
        disableEscapeKeyDown: true
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
export const DialogProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [dialogs, setDialogs] = useState<DialogType[]>([])

  const remove = useCallback((id: string) => {
    setDialogs((old) => old.filter((dialog) => id !== dialog.id))

    dialogUpdateSignal.setValue({ id, state: "closed" })
  }, [])

  const add = useCallback((options: Omit<DialogType, "id">) => {
    generatedId++

    setDialogs((old) => [...old, { ...options, id: generatedId.toString() }])

    const id = generatedId.toString()

    const promise = new Promise<void>((resolve) => {
      const sub = dialogUpdateSignal.subject.subscribe((value) => {
        if (value?.id === id && value.state === "closed") {
          sub.unsubscribe()
          resolve()
        }
      })
    })

    return { id: generatedId.toString(), promise }
  }, [])

  const controls = useMemo(
    () => ({
      remove,
      add
    }),
    [add, remove]
  )

  return (
    <>
      <ManageDialogContext.Provider value={controls}>
        {children}
        <DialogContext.Provider value={dialogs}>
          {dialogs.length > 0 && <InnerDialog />}
        </DialogContext.Provider>
      </ManageDialogContext.Provider>
    </>
  )
}
