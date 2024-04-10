import { Observable, catchError } from "rxjs"
import { CancelError } from "./errors"

export const catchCancelError =
  <T>(cb: (err: unknown) => Observable<T>) =>
  (source: Observable<T>) =>
    source.pipe(
      catchError((err) => {
        if (err instanceof CancelError) {
          return cb(err)
        }

        throw err
      })
    )
