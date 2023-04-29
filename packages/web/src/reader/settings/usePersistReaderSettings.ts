import { tap, EMPTY } from "rxjs"
import { useReader } from "../states"
import { setReaderSettingsState } from "./states"
import { useSubscribe } from "reactjrx"

export const usePersistReaderInstanceSettings = () => {
  const reader = useReader()

  useSubscribe(
    () =>
      !reader
        ? EMPTY
        : reader?.settings$.pipe(
            tap((settings) => {
              setReaderSettingsState((state) => ({
                ...state,
                fontScale: settings.fontScale
              }))
            })
          ),
    [reader]
  )
}
