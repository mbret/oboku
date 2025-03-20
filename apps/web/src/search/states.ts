import { signal } from "reactjrx"

export const searchStateSignal = signal({
  key: "searchState",
  default: "",
})
