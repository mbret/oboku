import { useSignalValue, useSubscribe } from "reactjrx"
import { tap } from "rxjs"
import { isMenuShownStateSignal, readerSignal } from "../states"

export const useGestureHandler = () => {
  const reader = useSignalValue(readerSignal)

  useSubscribe(
    () =>
      reader?.gestures.gestures$.pipe(
        tap(({ event, handled }) => {
          /**
           * Toggle menu when tap is not navigating
           */
          if (event.type === "tap" && !handled) {
            isMenuShownStateSignal.setValue((val) => !val)
          }
        })
      ),
    [reader]
  )
}
