import { atom } from "recoil"

export const readerSettingsState = atom<{
  floatingTime?: "bottom"
  floatingProgress?: "bottom"
}>({
  key: "readerSettingsState",
  default: {
    floatingProgress: "bottom",
    floatingTime: "bottom"
  }
})
