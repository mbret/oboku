import { ReadingStateState } from "@oboku/shared"
import { DownloadState } from "../download/states"
import { LibraryViewMode } from "../rxdb"
import { signal } from "reactjrx"

export type LibraryDocType = {
  viewMode: LibraryViewMode
  sorting: LibrarySorting
  isLibraryUnlocked: boolean
  tags: string[]
  readingStates: ReadingStateState[]
  downloadState?: DownloadState | undefined
  isNotInterested?: "only" | "hide"
}

export type LibrarySorting = "date" | "activity" | "alpha"

const defaultValue: LibraryDocType = {
  isLibraryUnlocked: false,
  viewMode: LibraryViewMode.GRID,
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
