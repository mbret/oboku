import { atom } from "recoil"

export const isUploadBookFromDeviceOpenedFromState = atom<
  false | "local" | "outside"
>({
  key: "isUploadBookFromDeviceOpenedState",
  default: false
})
