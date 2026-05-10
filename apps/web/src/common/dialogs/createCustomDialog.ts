import type { ReactNode } from "react"
import { CancelError } from "../../errors/errors.shared"
import { getNextDialogId } from "./getNextDialogId"
import { removeDialog } from "./removeDialog"
import { type CustomDialogType, dialogSignal } from "./state"

export type CustomDialogControls<Result> = {
  id: string
  confirm: (result: Result) => void
  cancel: () => void
}

export type CustomDialogHandle<Result> = {
  id: string
  close: () => void
  promise: Promise<Result>
}

export type CreateCustomDialogOptions<Result> = {
  render: (controls: CustomDialogControls<Result>) => ReactNode
}

export const createCustomDialog = <Result = undefined>({
  render,
}: CreateCustomDialogOptions<Result>): CustomDialogHandle<Result> => {
  const id = getNextDialogId()
  let isSettled = false
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
      rejectDialog?.(new CancelError())
    })
  }

  const promise = new Promise<Result>((resolve, reject) => {
    rejectDialog = reject

    const confirmDialog = (dialogResult: Result) => {
      settle(() => {
        resolve(dialogResult)
      })
    }

    const cancelDialog = () => {
      close()
    }

    const wrappedDialog: CustomDialogType = {
      id,
      type: "custom",
      render: () =>
        render({
          id,
          confirm: confirmDialog,
          cancel: cancelDialog,
        }),
    }

    dialogSignal.setValue((old) => [...old, wrappedDialog])
  })

  return {
    id,
    close,
    promise,
  }
}
