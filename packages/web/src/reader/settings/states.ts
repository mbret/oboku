import { signal, useSignalValue } from "reactjrx"

export const readerSettingsStateSignal = signal<{
  floatingTime?: "bottom"
  floatingProgress?: "bottom"
  fontScale?: number
}>({
  key: "readerSettingsState",
  default: {
    floatingProgress: "bottom",
    floatingTime: "bottom",
  },
})

export const setReaderSettingsState = readerSettingsStateSignal.setValue

export const useReaderSettingsState = () =>
  useSignalValue(readerSettingsStateSignal)
