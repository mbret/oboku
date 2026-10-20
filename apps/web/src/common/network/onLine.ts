import { first, fromEvent, map, merge, shareReplay, startWith } from "rxjs"

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
