import { ignoreElements, map, type Observable, retry, tap } from "rxjs"
import { Logger } from "../../debug/logger.shared"

/** Reports each error the stream throws, and lets it through. */
export const reportErrors = <S>(stream: Observable<S>) =>
  stream.pipe(
    tap({
      error: function reportError(error) {
        Logger.error(error)
      },
    }),
  )

export const retryAndLogError =
  <S>() =>
  (stream: Observable<S>) =>
    stream.pipe(reportErrors, retry())

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
