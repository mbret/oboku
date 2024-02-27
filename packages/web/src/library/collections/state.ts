import { signal } from "reactjrx"

export const collectionsListSignal = signal<{
  readingState: "ongoing" | "finished" | "any"
  viewMode: "grid" | "list"
}>({
  key: "collectionsListSignal",
  default: {
    readingState: "any",
    viewMode: "grid"
  }
})
