import { signal } from "reactjrx"

export const collectionsListSignal = signal<{
  readingState: "ongoing" | "finished" | "any"
}>({
  key: "collectionsListSignal",
  default: {
    readingState: "any"
  }
})
