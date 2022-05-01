import { ReadingStateState } from "@oboku/shared"
import { atom } from "recoil"
import { DownloadState } from "../download/states"
import { LibraryViewMode } from "../rxdb"

export type LibraryDocType = {
  viewMode: LibraryViewMode
  sorting: LibrarySorting
  isLibraryUnlocked: boolean
  tags: string[]
  readingStates: ReadingStateState[]
  downloadState?: DownloadState | undefined
}

export type LibrarySorting = "date" | "activity" | "alpha"

export const libraryState = atom<LibraryDocType>({
  key: "libraryState",
  default: {
    isLibraryUnlocked: false,
    viewMode: LibraryViewMode.GRID,
    sorting: "date",
    tags: [],
    readingStates: [],
    downloadState: undefined
  }
})

export const isUploadBookDrawerOpenedState = atom({
  key: "isUploadBookDrawerOpenedState",
  default: false
})

export const syncState = atom({
  key: "syncState",
  default: {
    isSyncing: false,
    syncRefresh: 0
  }
})
