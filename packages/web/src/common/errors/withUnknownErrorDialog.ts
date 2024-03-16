import { Observable, catchError } from "rxjs"
import { CancelError, OfflineError } from "./errors"
import { createDialog } from "../dialogs/createDialog"

export function withUnknownErrorDialog() {
  return function operator<T>(stream: Observable<T>) {
    return stream.pipe(
      catchError((error) => {
        if (error instanceof CancelError) throw error
        if (error instanceof OfflineError) throw error

        createDialog({ preset: "UNKNOWN_ERROR" })

        throw error
      })
    )
  }
}
