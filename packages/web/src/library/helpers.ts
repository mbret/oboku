import { ReadingStateState } from "@oboku/shared"
import { useCallback } from "react"
import { libraryStateSignal } from "./states"

export const useToggleTag = () => {
  return useCallback(async (tagId: string) => {
    const library = libraryStateSignal.getValue()
    const tagExist = library.tags.find((id) => tagId === id)
    if (tagExist) {
      libraryStateSignal.setValue((old) => ({
        ...old,
        tags: old.tags.filter((id) => id !== tagId)
      }))
    } else {
      libraryStateSignal.setValue((old) => ({
        ...old,
        tags: [...old.tags, tagId]
      }))
    }
  }, [])
}

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
