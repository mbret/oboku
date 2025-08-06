import {
  catchError,
  ignoreElements,
  map,
  type Observable,
  retry,
  tap,
} from "rxjs"
import { Logger } from "../../debug/logger.shared"

export const retryAndLogError =
  <S>() =>
  (stream: Observable<S>) =>
    stream.pipe(
      catchError((error) => {
        Logger.error(error)

        throw error
      }),
      retry(),
    )

export const rethrow =
  <S>(error: unknown) =>
  (stream: Observable<S>) =>
    stream.pipe(
      tap(() => {
        throw error
      }),
      ignoreElements(),
    )

export const throwIfNotDefined = <S>(
  stream: Observable<S>,
): Observable<NonNullable<S>> =>
  stream.pipe(
    map((value) => {
      if (value === undefined || value === null) {
        throw new Error("Value is undefined or null")
      }

      return value
    }),
  )
