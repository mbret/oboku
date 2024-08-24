import { signal } from "reactjrx"

export const serviceWorkerReadySignal = signal({
  default: false
})
