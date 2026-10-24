import { defer, first, merge, Observable, of } from "rxjs"

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
