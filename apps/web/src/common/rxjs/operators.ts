import { retryBackoff } from "reactjrx"
import { ignoreElements, map, type Observable, retry, tap } from "rxjs"
import { Logger } from "../../debug/logger.shared"
import { whenOnLine$ } from "../network/onLine"

const RETRY_DELAY_MS = 1000
const RETRY_MAX_DELAY_MS = 5 * 60 * 1000

/** Reports each error the stream throws, and lets it through. */
export const reportErrors = <S>(stream: Observable<S>) =>
  stream.pipe(
    tap({
      error: function reportError(error) {
        Logger.error(error)
      },
    }),
  )

/**
 * Reports each failure and retries once the device is online, waiting a
 * second the first time and twice as long each time after, up to five minutes.
 */
export const retryOnFailure = <O>(stream: Observable<O>) =>
  stream.pipe(
    reportErrors,
    retryBackoff({
      initialInterval: RETRY_DELAY_MS,
      maxInterval: RETRY_MAX_DELAY_MS,
      retryAfter: function waitForDeviceOnLine() {
        return whenOnLine$
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
