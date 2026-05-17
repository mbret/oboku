import { type Observable, catchError } from "rxjs"
import { CancelError, OfflineError } from "./errors.shared"
import { showDialog } from "../common/dialogs/createDialog"
import { createUnknownErrorDialogOptions } from "../common/dialogs/presets"

export function withUnknownErrorDialog() {
  return function operator<T>(stream: Observable<T>) {
    return stream.pipe(
      catchError((error) => {
        if (error instanceof CancelError) throw error
        if (error instanceof OfflineError) throw error

        showDialog(createUnknownErrorDialogOptions())

        throw error
      }),
    )
  }
}
