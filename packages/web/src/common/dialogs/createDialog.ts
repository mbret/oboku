import { Observable, noop, share } from "rxjs"
import { CancelError } from "../errors/errors"
import { DialogType, dialogSignal } from "./state"

let generatedId = 0

export const createDialog = <Result = undefined>(
  dialog: Omit<DialogType<Result>, "id">
) => {
  generatedId++
  const id = generatedId.toString()

  const $ = new Observable<Result>((observer) => {
    const wrappedDialog: DialogType<Result> = {
      ...dialog,
      id,
      onCancel: () => {
        dialog.onCancel?.()
        observer.error(new CancelError())
        observer.complete()
      },
      onConfirm: () => {
        const data = dialog.onConfirm?.()
        observer.next(data)
        observer.complete()

        return data as Result
      },
      actions: dialog.actions?.map((action) => ({
        ...action,
        onConfirm: () => {
          const data = action.onConfirm?.()

          console.log("data", data)
          observer.next(data)
          observer.complete()

          return data as Result
        }
      }))
    }

    dialogSignal.setValue((old) => [...old, wrappedDialog])
  }).pipe(share())

  $.subscribe({ error: noop })

  return { id, $ }
}
