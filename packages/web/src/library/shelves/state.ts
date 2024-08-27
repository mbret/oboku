import { signal } from "reactjrx"

export const libraryShelvesSettingsSignal = signal<{
  readingState: "ongoing" | "finished" | "any"
  viewMode: "grid" | "list"
  showNotInterestedCollections?: boolean
}>({
  key: "collectionsListSignal",
  default: {
    readingState: "any",
    viewMode: "grid"
  }
})
