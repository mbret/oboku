import { ReadingStateState } from "@oboku/shared"
import { atom } from "recoil"
import { DownloadState } from "../download/states"
import { LibraryViewMode } from "../rxdb"
import { signal, withPersistance } from "reactjrx"

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

export const [
  libraryStatePersist,
  useLibraryState,
  updateLibraryState,
  getLibraryState,
  libraryState$
] = withPersistance(
  signal({
    key: "libraryState",
    default: defaultValue
  })
)

export const [
  useIsUploadBookDrawerOpenedState,
  setIsUploadBookDrawerOpenedState
] = signal({
  key: "isUploadBookDrawerOpenedState",
  default: false
})

export const [useSyncState, setSyncState] = signal({
  key: "syncState",
  default: {
    isSyncing: false,
    syncRefresh: 0
  }
})
