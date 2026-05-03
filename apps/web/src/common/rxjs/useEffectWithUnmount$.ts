import { useEffect, type DependencyList, type EffectCallback } from "react"
import { ReplaySubject, type Observable } from "rxjs"

/**
 * `useEffect` variant that hands the effect a `ReplaySubject<void>`
 * which emits + completes on cleanup. Useful for tearing down rxjs
 * pipelines (e.g. `takeUntil(onUnmount$)`) tied to the effect's
 * lifecycle.
 */
export const useEffectWithUnmount$ = (
  effect: (onUnmount$: Observable<void>) => ReturnType<EffectCallback>,
  deps: DependencyList,
) => {
  useEffect(() => {
    const onUnmount$ = new ReplaySubject<void>(1)

    const cleanup = effect(onUnmount$)

    return () => {
      if (typeof cleanup === "function") {
        cleanup()
      }
      onUnmount$.next()
      onUnmount$.complete()
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: deps are forwarded verbatim from the caller; the lint rule is enforced at the call site via the `hooks` option for this hook in biome.json.
  }, deps)
}
