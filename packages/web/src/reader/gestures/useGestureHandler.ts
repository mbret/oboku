import { useSignalValue, useSubscribe } from "reactjrx"
import { tap } from "rxjs"
import { isMenuShownStateSignal, readerSignal } from "../states"

export const useGestureHandler = () => {
  const reader = useSignalValue(readerSignal)

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