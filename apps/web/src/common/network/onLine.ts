import {
  first,
  fromEvent,
  map,
  merge,
  mergeMap,
  type Observable,
  retry,
  shareReplay,
  startWith,
  timer,
} from "rxjs"

const QUICK_RETRY_COUNT = 5
const QUICK_RETRY_DELAY_MS = 1
const SLOW_RETRY_DELAY_MS = 5 * 60 * 1000

const windowOnlineEvent$ = fromEvent(window, "online")
const windowOfflineEvent$ = fromEvent(window, "offline")

export const navigatorOnLine$ = merge(
  windowOnlineEvent$,
  windowOfflineEvent$,
).pipe(
  startWith(null),
  map(() => navigator.onLine),
  shareReplay({ bufferSize: 1, refCount: true }),
)

const isOnLine = (onLine: boolean) => onLine

/** Emits once the device is online, right away when it already is. */
export const whenOnLine$ = navigatorOnLine$.pipe(first(isOnLine))

/**
 * Retries a failed stream while the device is online: right away for the
 * first few failures and every five minutes after that, or as soon as the
 * device is back online when it is offline.
 */
export const retryWhenOnLine = <T>(stream: Observable<T>) =>
  stream.pipe(
    retry({
      delay: function waitForNetworkToRetry(_error, retryCount) {
        return navigatorOnLine$.pipe(
          first(),
          mergeMap(function delayRetry(onLine) {
            if (!onLine) return whenOnLine$

            const isQuickRetry = retryCount <= QUICK_RETRY_COUNT

            return timer(
              isQuickRetry ? QUICK_RETRY_DELAY_MS : SLOW_RETRY_DELAY_MS,
            )
          }),
        )
      },
    }),
  )
