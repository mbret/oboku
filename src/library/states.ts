import { atom } from "recoil";
import { LibraryViewMode } from "../rxdb/databases";

export type LibraryDocType = {
  viewMode: LibraryViewMode,
  sorting: LibrarySorting
  isLibraryUnlocked: boolean,
  tags: string[]
}

export type LibrarySorting = 'date' | 'activity' | 'alpha'

export const libraryState = atom<LibraryDocType>({
  key: 'libraryState_persist',
  default: {
    isLibraryUnlocked: false,
    viewMode: LibraryViewMode.GRID,
    sorting: 'date',
    tags: []
  },
});

export const syncState = atom({
  key: 'syncState',
  default: {
    isSyncing: false,
    syncRefresh: 0,
  }
})