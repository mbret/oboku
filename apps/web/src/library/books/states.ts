import type { ReadingStateState } from "@oboku/shared"
import type { DownloadState } from "../../download/states"
import { signal } from "reactjrx"
import type { ListActionViewMode } from "../../common/lists/ListActionsToolbar"

type LibraryDocType = {
  viewMode: ListActionViewMode
  sorting: LibrarySorting
  isLibraryUnlocked: boolean
  tags: string[]
  readingStates: ReadingStateState[]
  downloadState?: DownloadState | undefined
  isNotInterested?: "only" | "hide"
}

export type LibrarySorting = "date" | "activity" | "alpha"

export const libraryStateSignalDefaultValue: LibraryDocType = {
  isLibraryUnlocked: false,
  viewMode: "grid",
  sorting: "date",
  tags: [],
  readingStates: [],
  downloadState: undefined,
}

export const libraryStateSignal = signal({
  key: "libraryState",
  default: libraryStateSignalDefaultValue,
})

export const isUploadBookDrawerOpenedStateSignal = signal({
  key: "isUploadBookDrawerOpenedState",
  default: false,
})
