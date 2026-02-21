import { ReadingStateState } from "@oboku/shared"
import { useIncrementalBookPatch } from "./useIncrementalBookPatch"

export const useMarkBookAsUnread = () => {
  const { mutate: incrementalBookPatch } = useIncrementalBookPatch()

  return (bookId: string) => {
    incrementalBookPatch({
      doc: bookId,
      patch: {
        readingStateCurrentState: ReadingStateState.NotStarted,
        readingStateCurrentBookmarkProgressPercent: 0,
        readingStateCurrentBookmarkProgressUpdatedAt: new Date().toISOString(),
        readingStateCurrentBookmarkLocation: null,
      },
    })
  }
}

export const useMarkBookAsFinished = () => {
  const { mutate: incrementalBookPatch } = useIncrementalBookPatch()

  return (bookId: string) => {
    incrementalBookPatch({
      doc: bookId,
      patch: {
        readingStateCurrentState: ReadingStateState.Finished,
        readingStateCurrentBookmarkProgressPercent: 1,
        readingStateCurrentBookmarkProgressUpdatedAt: new Date().toISOString(),
        readingStateCurrentBookmarkLocation: null,
      },
    })
  }
}
