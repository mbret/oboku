import { signal, withPersistance } from "reactjrx"

export const [readerSettingsStatePersist, useReaderSettingsState, setReaderSettingsState] = withPersistance(signal<{
  floatingTime?: "bottom"
  floatingProgress?: "bottom"
  fontScale?: number
}>({
  key: "readerSettingsState",
  default: {
    floatingProgress: "bottom",
    floatingTime: "bottom"
  }
}))
