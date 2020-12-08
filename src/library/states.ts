import { atom } from "recoil";
import { LibraryDocType } from "../rxdb";
import { LibraryViewMode } from "../rxdb/databases";

export type LibrarySorting = 'date' | 'activity' | 'alpha'

export const libraryState = atom<LibraryDocType>({
  key: 'libraryState',
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