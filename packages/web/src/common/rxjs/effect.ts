import { catchError, EMPTY, mergeMap, Observable, of } from "rxjs"

export const effect = <T>(
  effect$: Observable<T>,
  execute: (effect$: Observable<T>) => Observable<any>
) => {
  const subscription = effect$
    .pipe(
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
