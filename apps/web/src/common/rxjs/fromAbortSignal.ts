import { Observable } from "rxjs"

/**
 * Bridges an `AbortSignal` into an Observable. Emits a single `void`
 * the moment the signal aborts, including synchronously when the
 * signal is already aborted at subscription time (which a plain
 * `fromEvent(signal, "abort")` would miss).
 */
export const fromAbortSignal = (signal: AbortSignal): Observable<void> =>
  new Observable<void>((subscriber) => {
    const onAbort = () => {
      subscriber.next()
      subscriber.complete()
    }

    if (signal.aborted) {
      onAbort()
      return
    }

    signal.addEventListener("abort", onAbort, { once: true })

    return () => signal.removeEventListener("abort", onAbort)
  })
