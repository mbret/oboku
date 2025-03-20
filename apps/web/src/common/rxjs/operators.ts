import { catchError, type Observable, retry } from "rxjs"
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
