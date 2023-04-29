import { signal } from "reactjrx"

export const [
  useIsUploadBookFromDeviceOpened,
  setIsUploadBookFromDeviceOpened,
  ,
  ,
  ,
  isUploadBookFromDeviceOpenedState
] = signal<false | "local" | "outside">({
  default: false
})
