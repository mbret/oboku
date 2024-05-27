import { tap, EMPTY } from "rxjs"
import { readerStateSignal } from "../states"
import { setReaderSettingsState } from "./states"
import { useSignalValue, useSubscribe } from "reactjrx"

export const usePersistReaderInstanceSettings = () => {
  const reader = useSignalValue(readerStateSignal)

  useSubscribe(
    () =>
      !reader
        ? EMPTY
        : reader?.settings.settings$.pipe(
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
