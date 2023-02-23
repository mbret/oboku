import { usePagination } from "./states"
import { useAtomicUpdateBook } from "../books/helpers"
import { ReadingStateState } from "@oboku/shared"
import { useDebounce } from "react-use"
import { useReader } from "./ReaderProvider"

export const useUpdateBookState = (bookId: string) => {
  const [updateBook] = useAtomicUpdateBook()
  const { reader$ } = useReader()
  const { beginCfi } = usePagination(reader$) ?? {}
  const totalBookProgress = usePagination(reader$)?.percentageEstimateOfBook

  const updater = async () => {
    updateBook(bookId, (old) => ({
      ...old,
      // cfi will be undefined at the beginning until pagination stabilize
      ...(beginCfi && {
        readingStateCurrentBookmarkLocation: beginCfi || null
      }),
      readingStateCurrentBookmarkProgressUpdatedAt: new Date().toISOString(),
      ...(old.readingStateCurrentState !== ReadingStateState.Finished && {
        readingStateCurrentState: ReadingStateState.Reading,
        ...(totalBookProgress === 1 && {
          readingStateCurrentState: ReadingStateState.Finished
        })
      }),
      ...(typeof totalBookProgress === "number" && {
        readingStateCurrentBookmarkProgressPercent: totalBookProgress
      })
    }))
  }

  useDebounce(updater, 400, [updateBook, beginCfi, totalBookProgress])
}
