import { Observable, share, tap } from "rxjs"
import { CancelError } from "../errors/errors"
import { DialogType, dialogSignal } from "./state"

let generatedId = 0

export const createDialog = <Result = undefined>(
  dialog: Omit<DialogType<Result>, "id">
) => {
  generatedId++
  const id = generatedId.toString()

  const $ = new Observable<Result>((observer) => {
    let isClosed = false

    const wrappedDialog: DialogType<Result> = {
      ...dialog,
      id,
      onCancel: () => {
        isClosed = true
        dialog.onCancel?.()
        observer.error(new CancelError())
        observer.complete()
      },
      onConfirm: () => {
        isClosed = true
        const data = dialog.onConfirm?.()
        observer.next(data)
        observer.complete()

        return data as Result
      },
      actions: dialog.actions?.map((action) => ({
        ...action,
        onConfirm: () => {
          isClosed = true
          const data = action.onConfirm?.()

          observer.next(data)
          observer.complete()

          return data as Result
        }
      }))
    }

    dialogSignal.setValue((old) => [...old, wrappedDialog])

    return () => {
      /**
       * Make sure to close the dialog if there are no more subscribers
       * and if the dialog is cancellable
       */
      if (!isClosed && dialog.cancellable !== false) {
        dialog.onCancel?.()
      }
    }
  }).pipe(share())

  return { id, $ }
}
