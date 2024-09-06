import { useObserve, useSignalValue } from "reactjrx"
import { readerSignal } from "../states"
import { useIsUsingPagesPerChapter } from "./useIsUsingPagesPerChapter"

export const useCurrentPages = ({ bookId }: { bookId?: string }) => {
  const reader = useSignalValue(readerSignal)
  const {
    beginPageIndexInSpineItem,
    endPageIndexInSpineItem,
    beginAbsolutePageIndex,
    endAbsolutePageIndex
  } = useObserve(() => reader?.pagination.state$, [reader]) ?? {}
  const isUsingPagesPerChapter = useIsUsingPagesPerChapter({ bookId })

  if (isUsingPagesPerChapter) {
    return [beginPageIndexInSpineItem, endPageIndexInSpineItem] as const
  }

  return [beginAbsolutePageIndex, endAbsolutePageIndex] as const
}
