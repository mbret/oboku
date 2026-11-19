import {
  from,
  fromEvent,
  map,
  merge,
  type Observable,
  shareReplay,
  startWith,
  switchMap,
} from "rxjs"

const beforeInstallPromptEvent$ = fromEvent<BeforeInstallPromptEvent>(
  window,
  "beforeinstallprompt",
)
const appInstalledEvent$ = fromEvent(window, "appinstalled")

const toPromptUntilAnswered = (installPrompt: BeforeInstallPromptEvent) =>
  from(installPrompt.userChoice).pipe(
    map(() => null),
    startWith(installPrompt),
  )

/**
 * The install prompt the browser offers, `null` while it offers none: before
 * its first offer, once the user answered the prompt, which opens only once,
 * and once the app is installed.
 */
export const installPrompt$: Observable<BeforeInstallPromptEvent | null> =
  merge(
    beforeInstallPromptEvent$.pipe(switchMap(toPromptUntilAnswered)),
    appInstalledEvent$.pipe(map(() => null)),
  ).pipe(startWith(null), shareReplay({ bufferSize: 1, refCount: true }))

// The browser usually offers the install around page load, long before the
// profile screen that shows the offer mounts.
installPrompt$.subscribe()
