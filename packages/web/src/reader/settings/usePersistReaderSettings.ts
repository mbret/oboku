import { tap, EMPTY } from "rxjs"
import { readerSignal } from "../states"
import { setReaderSettingsState } from "./states"
import { useSignalValue, useSubscribe } from "reactjrx"

export const usePersistReaderInstanceSettings = () => {
  const reader = useSignalValue(readerSignal)

  useSubscribe(
    () =>
      !reader
        ? EMPTY
        : reader?.settings.values$.pipe(
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
