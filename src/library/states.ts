import { atom } from "recoil";
import { LibraryDocType } from "../databases";
import { LibraryViewMode } from "../rxdb/databases";

export const libraryState = atom<LibraryDocType>({
  key: 'libraryState',
  default: {
    isLibraryUnlocked: false,
    viewMode: LibraryViewMode.GRID
  },
});