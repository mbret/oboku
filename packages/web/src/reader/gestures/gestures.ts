import { useEffect } from "react"
import { useSignalValue, useSubscribe } from "reactjrx"
import { tap } from "rxjs"
import { isMenuShownStateSignal, readerSignal } from "../states"

export const useGestureHandler = () => {
  const reader = useSignalValue(readerSignal)

  useEffect(() => {
    const deregister = reader?.gestures.hookManager.register(
      "beforeTap",
      ({ event }) => {
        const target = event.event.target

        // if (isWithinBookmarkArea(target)) {
        //   return false
        // }

        return true
      }
    )

    return () => {
      deregister?.()
    }
  }, [reader])

  useSubscribe(
    () =>
      reader?.gestures.unhandledEvent$.pipe(
        tap((event) => {
          /**
           * Toggle menu when tap is not navigating
           */
          if (event.type === "tap") {
            isMenuShownStateSignal.setValue((val) => !val)
          }
        })
      ),
    [reader]
  )
}
