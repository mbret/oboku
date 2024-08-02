import { catchError, Observable, retry } from "rxjs"
import { Report } from "../../debug/report.shared"

export const retryAndLogError =
  <S>() =>
  (stream: Observable<S>) =>
    stream.pipe(
      catchError((error) => {
        Report.error(error)

        throw error
      }),
      retry()
    )
