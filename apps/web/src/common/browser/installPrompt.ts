import {
  from,
  fromEvent,
  map,
  merge,
  type Observable,
  of,
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
  merge(of(installPrompt), from(installPrompt.userChoice).pipe(map(() => null)))

/**
 * The install prompt the browser offers, `null` while it offers none: before
 * its first offer, once the user answered the prompt, which opens only once,
 * and once the app is installed. Only Chromium browsers make an offer.
 *
 * The browser usually makes its offer around page load. A subscriber gets an
 * offer made before it subscribed only when an earlier subscription was
 * already listening.
 */
export const installPrompt$: Observable<BeforeInstallPromptEvent | null> =
  merge(
    beforeInstallPromptEvent$.pipe(switchMap(toPromptUntilAnswered)),
    appInstalledEvent$.pipe(map(() => null)),
  ).pipe(startWith(null), shareReplay({ bufferSize: 1, refCount: false }))
