import { useObserve, useSignalValue } from "reactjrx"
import { readerSignal } from "../states"
import { useIsUsingPagesPerChapter } from "./useIsUsingPagesPerChapter"

export const useCurrentPage = ({ bookId }: { bookId?: string }) => {
  const reader = useSignalValue(readerSignal)
  const { beginPageIndexInSpineItem, beginSpineItemIndex } =
    useObserve(() => reader?.pagination.state$, [reader]) ?? {}
  const isUsingPagesPerChapter = useIsUsingPagesPerChapter({ bookId })

  if (isUsingPagesPerChapter) return beginPageIndexInSpineItem

  return beginSpineItemIndex
}
