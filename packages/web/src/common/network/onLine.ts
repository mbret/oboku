import { fromEvent, map, merge, share, startWith } from "rxjs"

const windowOnlineEvent$ = fromEvent(window, "online")
const windowOfflineEvent$ = fromEvent(window, "offline")

export const navigatorOnLine$ = merge(
  windowOnlineEvent$,
  windowOfflineEvent$
).pipe(
  startWith(null),
  map(() => navigator.onLine),
  share()
)
