import { signal } from "reactjrx"

export const syncSignal = signal({
  default: {
    active: 0,
  },
})
