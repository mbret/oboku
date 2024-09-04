import { signal } from "reactjrx"

export const libraryShelvesFiltersSignal = signal<{
  readingState: "ongoing" | "finished" | "any"
  viewMode: "grid" | "list"
  showNotInterestedCollections?: boolean
}>({
  key: "libraryShelvesFiltersSignal",
  default: {
    readingState: "any",
    viewMode: "grid"
  }
})
