import { Observable } from "rxjs"

/**
 * Starts `run` on subscription and emits what its promise resolves with.
 * Unsubscribing before the promise settles aborts the signal `run` was given.
 */
export const fromAbortable = <Value>(
  run: (signal: AbortSignal) => Promise<Value>,
) =>
  new Observable<Value>(function runAbortably(subscriber) {
    const abortController = new AbortController()

    function abortUnsettledRun() {
      abortController.abort()
    }

    subscriber.add(abortUnsettledRun)

    run(abortController.signal).then(
      function emitResult(value) {
        subscriber.remove(abortUnsettledRun)
        subscriber.next(value)
        subscriber.complete()
      },
      function emitFailure(error) {
        subscriber.remove(abortUnsettledRun)
        subscriber.error(error)
      },
    )
  })
