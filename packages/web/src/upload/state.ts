import { signal } from "reactjrx"

export const isUploadBookFromDeviceOpenedStateSignal = signal<
  false | "local" | "outside"
>({
  key: "isUploadBookFromDeviceOpenedState",
  default: false
})
