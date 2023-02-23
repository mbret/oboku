import { atom } from "recoil"

export const readerSettingsState = atom<{
  floatingTime?: "bottom"
  floatingProgress?: "bottom"
  fontScale?: number
}>({
  key: "readerSettingsState",
  default: {
    floatingProgress: "bottom",
    floatingTime: "bottom"
  }
})
