import { retryBackoff } from "reactjrx"
import { defer, first, merge, Observable, of } from "rxjs"
import { whenOnLine$ } from "./network/onLine"
import { reportErrors } from "./rxjs/operators"

const RETRY_DELAY_MS = 1000
const RETRY_MAX_DELAY_MS = 5 * 60 * 1000

/**
 * Reports each failure and retries once the device is online, waiting a
 * second the first time and twice as long each time after, up to five minutes.
 */
export const retryOnFailure = <O>(stream: Observable<O>) =>
  stream.pipe(
    reportErrors,
    retryBackoff({
      initialInterval: RETRY_DELAY_MS,
      maxInterval: RETRY_MAX_DELAY_MS,
      retryAfter: function waitForDeviceOnLine() {
        return whenOnLine$
      },
    }),
  )

export const loadScript = ({ id, src }: { id: string; src: string }) => {
  return defer(() => {
    const existingElement = document.getElementById(id)

    // already loaded
    if (existingElement?.dataset.state === "success") {
      return of(null)
    }

    // error state
    if (existingElement?.dataset.state === "error") {
      existingElement.remove()
    }

    const script =
      existingElement instanceof HTMLScriptElement
        ? existingElement
        : document.createElement("script")
    script.id = id
    script.src = src
    script.async = true
    script.defer = true
    script.dataset.state = "loading"

    const scriptLoad$ = new Observable<void>((observer) => {
      script.onload = () => {
        script.dataset.state = "success"
        observer.next()
        observer.complete()
      }
    })

    const scriptError$ = new Observable((observer) => {
      script.onerror = (e: Event | string) => {
        script.dataset.state = "error"
        observer.error(e)
        observer.complete()
      }
    })

    if (!document.body.contains(script)) {
      document.body.appendChild(script)
    }

    return merge(scriptLoad$, scriptError$).pipe(first())
  })
}
