import {
  type Observable,
  type ObservableInput,
  type ObservedValueOf,
  catchError,
} from "rxjs"
import { CancelError } from "./errors.shared"

export const catchCancelError =
  <T, O extends ObservableInput<unknown>>(cb: (err: unknown) => O) =>
  (source: Observable<T>): Observable<T | ObservedValueOf<O>> =>
    source.pipe(
      catchError((err) => {
        if (err instanceof CancelError) {
          return cb(err)
        }

        throw err
      }),
    )
