import { type Observable, catchError } from "rxjs"
import { createDialog } from "../dialogs/createDialog"
import { OfflineError } from "../../errors/errors.shared"

export function withOfflineErrorDialog() {
  return function operator<T>(stream: Observable<T>) {
    return stream.pipe(
      catchError((error) => {
        if (error instanceof OfflineError) {
          createDialog({ preset: "OFFLINE", autoStart: true })
        }

        throw error
      }),
    )
  }
}
