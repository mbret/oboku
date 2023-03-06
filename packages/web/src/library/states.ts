import { ReadingStateState } from "@oboku/shared"
import { bind } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import { atom } from "recoil"
import { combineLatest, map, of, pairwise, scan, startWith } from "rxjs"
import { DownloadState } from "../download/states"
import { LibraryViewMode } from "../rxdb"

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

/**
 * @deprecated
 */
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

const defaultValue: LibraryDocType = {
  isLibraryUnlocked: false,
  viewMode: LibraryViewMode.GRID,
  sorting: "date",
  tags: [],
  readingStates: [],
  downloadState: undefined
}

export const [updateLibraryState$, updateLibraryState] =
  createSignal<Partial<LibraryDocType>>()

export const [useLibraryState, libraryState$] = bind(
  updateLibraryState$.pipe(
    scan(
      (acc, current) => ({
        ...acc,
        ...current
      }),
      defaultValue
    )
  ),
  defaultValue
)

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
