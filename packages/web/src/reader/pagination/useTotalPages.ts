import { useSignalValue, useObserve } from "reactjrx"
import { readerSignal } from "../states"
import { useIsUsingPagesPerChapter } from "./useIsUsingPagesPerChapter"

export const useTotalPages = ({ bookId }: { bookId: string }) => {
  const reader = useSignalValue(readerSignal)
  const { numberOfTotalPages, beginNumberOfPagesInSpineItem } =
    useObserve(() => reader?.pagination.state$, [reader]) ?? {}
  const isUsingPagesPerChapter = useIsUsingPagesPerChapter({ bookId })

  if (isUsingPagesPerChapter) return beginNumberOfPagesInSpineItem

  return numberOfTotalPages
}
