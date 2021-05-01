import { useRecoilValue } from "recoil"
import { paginationState, totalBookProgressState } from "./states"
import { useAtomicUpdateBook } from "../books/helpers"
import { ReadingStateState } from "@oboku/shared"
import { useDebounce } from "react-use"

export const useUpdateBookState = (bookId: string) => {
  const [updateBook] = useAtomicUpdateBook()
  const { begin } = useRecoilValue(paginationState) || {}
  const totalBookProgress = useRecoilValue(totalBookProgressState)
  const { cfi } = begin || {}

  const updater = async () => {
    updateBook(bookId, old => ({
      ...old,
      readingStateCurrentBookmarkLocation: cfi || null,
      readingStateCurrentBookmarkProgressUpdatedAt: (new Date()).toISOString(),
      ...(old.readingStateCurrentState !== ReadingStateState.Finished) && {
        readingStateCurrentState: ReadingStateState.Reading,
        ...totalBookProgress === 1 && {
          readingStateCurrentState: ReadingStateState.Finished,
        }
      },
      ...(typeof totalBookProgress === 'number') && {
        readingStateCurrentBookmarkProgressPercent: totalBookProgress,
      },
    }))
  }

  useDebounce(updater, 400, [updateBook, cfi, totalBookProgress])
}
