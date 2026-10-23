import { Observable } from "rxjs"

/**
 * Starts `run` on subscription and emits what its promise resolves with.
 * Unsubscribing aborts the signal `run` was given.
 */
export const fromAbortable = <Value>(
  run: (signal: AbortSignal) => Promise<Value>,
) =>
  new Observable<Value>(function runAbortably(subscriber) {
    const abortController = new AbortController()

    run(abortController.signal).then(
      function emitResult(value) {
        subscriber.next(value)
        subscriber.complete()
      },
      function emitFailure(error) {
        subscriber.error(error)
      },
    )

    return function abortRun() {
      abortController.abort()
    }
  })
