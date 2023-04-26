import { ReadingStateState } from "@oboku/shared"
import { useCallback } from "react"
import { useRecoilCallback, useSetRecoilState } from "recoil"
import { getLibraryState, updateLibraryState, syncState } from "./states"

export const useSyncLibrary = () => {
  const setSyncState = useSetRecoilState(syncState)

  return useCallback(
    () => setSyncState((old) => ({ ...old, syncRefresh: old.syncRefresh + 1 })),
    [setSyncState]
  )
}

export const useToggleTag = () =>
  useRecoilCallback(
    () => async (tagId: string) => {
      const library = getLibraryState()
      const tagExist = library.tags.find((id) => tagId === id)
      if (tagExist) {
        updateLibraryState((old) => ({
          ...old,
          tags: old.tags.filter((id) => id !== tagId)
        }))
      } else {
        updateLibraryState((old) => ({ ...old, tags: [...old.tags, tagId] }))
      }
    },
    []
  )

export const getDisplayableReadingState = (readingState: ReadingStateState) => {
  switch (readingState) {
    case ReadingStateState.Finished:
      return "Finished"
    case ReadingStateState.NotStarted:
      return "Not started"
    case ReadingStateState.Reading:
      return "Reading"
    default:
      return ""
  }
}
