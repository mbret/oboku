import { useUnmount } from "react-use"
import { BehaviorSubject, filter } from "rxjs"

export const useIsMountedState$ = () => {
  const isMountedStateSubject$ = new BehaviorSubject(true)

  useUnmount(() => {
    isMountedStateSubject$.next(false)
    isMountedStateSubject$.complete()
  })

  return {
    state$: isMountedStateSubject$.asObservable(),
    unMount$: isMountedStateSubject$.asObservable()
      .pipe(
        filter(v => !v)
      )
  }
}