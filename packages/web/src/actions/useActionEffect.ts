import { DependencyList, useEffect } from "react"
import { Observable, tap } from "rxjs"
import { actionSubject$ } from "./actionSubject$"
import { Action } from "./types"
import { useAction } from "./useAction"

export const useActionEffect = <
  Input extends Action,
  Output extends Input = Input
>(
  effect: (action$: Observable<Input>) => Observable<Output>,
  deps?: DependencyList
) => {
  const { execute } = useAction()

  useEffect(() => {
    const subscription = effect(actionSubject$.asObservable() as any)
      .pipe(tap(execute))
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [...Array.from(deps || []), execute])
}
