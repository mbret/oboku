import { defer, filter, first, merge, mergeMap, Observable, of, retry, timer } from "rxjs"
import { Report } from "../debug/report.shared"
import { navigatorOnLine$ } from "./network/onLine"

export const retryOnFailure = <O>(stream: Observable<O>) =>
  stream.pipe(
    /**
     * In case of error we retry in 1mn by default.
     * If network is offline, we wait for online and
     * retry right away. If we were online, it's unexpected
     * and will wait a couple of minutes before retrying
     */
    retry({
      delay: (error, retryCount) => {
        Report.error(error)

        return navigatorOnLine$.pipe(
          first(),
          mergeMap((onLine) => {
            if (onLine) return timer(retryCount > 5 ? 1000 * 60 * 5 : 1)

            return navigatorOnLine$.pipe(
              filter((onLine) => onLine),
              first()
            )
          })
        )
      }
    })
  )

export const loadScript = ({ id, src }: { id: string; src: string }) => {
  return defer(() => {
    const existingElement = document.getElementById(id)

    // already loaded
    if (existingElement?.dataset["state"] === "success") {
      return of(null)
    }

    // error state
    if (existingElement?.dataset["state"] === "error") {
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
    script.dataset["state"] = "loading"

    const scriptLoad$ = new Observable((observer) => {
      script.onload = () => {
        script.dataset["state"] = "success"
        observer.next()
        observer.complete()
      }
    })

    const scriptError$ = new Observable((observer) => {
      script.onerror = (e: Event | string) => {
        script.dataset["state"] = "error"
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
