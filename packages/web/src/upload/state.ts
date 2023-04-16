import { signal } from "reactjrx"

export const [
  useIsUploadBookFromDeviceOpened,
  setIsUploadBookFromDeviceOpened
] = signal<false | "local" | "outside">({
  default: false,
  scoped: true
})
