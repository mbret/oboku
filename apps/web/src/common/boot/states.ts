import { signal } from "reactjrx"

export const isAppReadyStateSignal = signal({
  key: `isAppReadyState`,
  default: false,
})
