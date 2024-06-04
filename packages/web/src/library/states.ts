import { ReadingStateState } from "@oboku/shared"
import { DownloadState } from "../download/states"
import { signal } from "reactjrx"
import { ListActionViewMode } from "../common/lists/ListActionsToolbar"

export type LibraryDocType = {
  viewMode: ListActionViewMode
  sorting: LibrarySorting
  isLibraryUnlocked: boolean
  tags: string[]
  readingStates: ReadingStateState[]
  downloadState?: DownloadState | undefined
  isNotInterested?: "only" | "hide"
  showNotInterestedCollections?: boolean
}

export type LibrarySorting = "date" | "activity" | "alpha"

const defaultValue: LibraryDocType = {
  isLibraryUnlocked: false,
  viewMode: "grid",
  sorting: "date",
  tags: [],
  readingStates: [],
  downloadState: undefined
}

export const libraryStateSignal = signal({
  key: "libraryState",
  default: defaultValue
})

export const isUploadBookDrawerOpenedStateSignal = signal({
  key: "isUploadBookDrawerOpenedState",
  default: false
})

export const syncStateSignal = signal({
  key: "syncState",
  default: {
    isSyncing: false,
    syncRefresh: 0
  }
})
