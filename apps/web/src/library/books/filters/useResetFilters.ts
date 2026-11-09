import { useCallback } from "react"
import { libraryStateSignal, libraryStateSignalDefaultValue } from "../states"

export const useResetFilters = () => {
  return useCallback(() => {
    libraryStateSignal.update((state) => ({
      ...state,
      tags: [],
      readingStates: libraryStateSignalDefaultValue.readingStates,
      downloadState: libraryStateSignalDefaultValue.downloadState,
      isNotInterested: libraryStateSignalDefaultValue.isNotInterested,
    }))
  }, [])
}
