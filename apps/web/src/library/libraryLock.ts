import { authorizeAction } from "../auth/AuthorizeActionDialog"
import { libraryStateSignal } from "./books/states"

/**
 * Lock the library so protected content is hidden again across all
 * surfaces that read `libraryStateSignal.isLibraryUnlocked`. No
 * authorization required to lock.
 */
export const lockLibrary = () => {
  libraryStateSignal.update((state) => ({
    ...state,
    isLibraryUnlocked: false,
  }))
}

/**
 * Prompt the user for the master password (or reuse the cached
 * authorization) and, on success, flip the library to its unlocked
 * state so protected content becomes visible globally. No-op when the
 * user cancels the authorization prompt.
 */
export const unlockLibrary = () => {
  authorizeAction(() => {
    libraryStateSignal.update((state) => ({
      ...state,
      isLibraryUnlocked: true,
    }))
  })
}
