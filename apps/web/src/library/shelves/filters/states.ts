import { signal } from "reactjrx"
import type { ListActionViewMode } from "../../../common/lists/ListActionsToolbar"

export const libraryShelvesFiltersSignal = signal<{
  readingState: "ongoing" | "finished" | "any"
  viewMode: ListActionViewMode
  showNotInterestedCollections?: boolean
}>({
  key: "libraryShelvesFiltersSignal",
  default: {
    readingState: "any",
    viewMode: "grid",
  },
})
