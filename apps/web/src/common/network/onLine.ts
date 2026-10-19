import { fromEvent, map, merge, shareReplay, startWith } from "rxjs"

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
