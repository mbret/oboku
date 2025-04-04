import { catchError, ignoreElements, type Observable, retry, tap } from "rxjs"
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
