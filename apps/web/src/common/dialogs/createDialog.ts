import {
  type DialogAction,
  type DialogTemplateType,
  dialogSignal,
} from "./state"
import { removeDialog } from "./removeDialog"
import { CancelError } from "../../errors/errors.shared"
import { getNextDialogId } from "./getNextDialogId"

type CreateDialogAction<Result> = Omit<DialogAction<Result>, "onAction"> & {
  onAction?: () => Result | null
}

export type CreateDialogOptions<Result = undefined> = Omit<
  DialogTemplateType<Result>,
  "actions" | "id" | "type"
> & {
  actions?: CreateDialogAction<Result>[]
}

export type DialogHandle<Result> = {
  id: string
  close: () => void
  promise: Promise<Result | null>
}

export const createDialog = <Result = undefined>({
  ...dialog
}: CreateDialogOptions<Result>): DialogHandle<Result> => {
  const id = getNextDialogId()
  let isSettled = false
  let resolveDialog: ((result: Result | null) => void) | undefined
  let rejectDialog: ((error: CancelError) => void) | undefined

  const closeDialog = () => {
    removeDialog(id)
  }

  const settle = (cb: () => void) => {
    if (isSettled) return

    isSettled = true
    cb()
    closeDialog()
  }

  const close = () => {
    settle(() => {
      dialog.onCancel?.()
      rejectDialog?.(new CancelError())
    })
  }

  const completeDialog = (getResult?: () => Result | null) => {
    if (isSettled) return null

    const data = getResult?.() ?? null

    settle(() => {
      resolveDialog?.(data)
    })

    return data
  }

  const createActions = (): DialogAction<Result>[] => {
    const actions = dialog.actions?.length
      ? dialog.actions
      : [
          {
            title: "Ok",
          },
        ]

    return actions.map((action) => ({
      ...action,
      onAction: () => completeDialog(action.onAction),
    }))
  }

  const promise = new Promise<Result | null>((resolve, reject) => {
    resolveDialog = resolve
    rejectDialog = reject

    const wrappedDialog: DialogTemplateType<Result> = {
      ...dialog,
      id,
      type: "template",
      onCancel: close,
      actions: createActions(),
    }

    dialogSignal.setValue((old) => [...old, wrappedDialog])
  })

  return {
    id,
    close,
    promise,
  }
}

const throwUnexpectedDialogError = (error: unknown) => {
  if (error instanceof CancelError) return

  throw error
}

export const showDialog = <Result = undefined>(
  options: CreateDialogOptions<Result>,
) => {
  const dialog = createDialog(options)

  void dialog.promise.catch(throwUnexpectedDialogError)

  return dialog
}
