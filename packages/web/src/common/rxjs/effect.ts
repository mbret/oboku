import { catchError, EMPTY, mergeMap, Observable, of, tap } from "rxjs"
import { Report } from "../../debug/report.shared"

export const effect = <T>(
  effect$: Observable<T>,
  execute: (effect$: Observable<T>) => Observable<any>
) => {
  const subscription = effect$
    .pipe(
      tap((data) => {
        Report.log("action$", data)
      }),
      mergeMap((value) =>
        execute(of(value)).pipe(
          catchError((error) => {
            console.error(error)

            return EMPTY
          })
        )
      )
    )
    .subscribe()

  return () => subscription.unsubscribe()
}
