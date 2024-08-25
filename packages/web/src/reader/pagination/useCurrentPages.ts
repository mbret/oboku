import { useObserve, useSignalValue } from "reactjrx"
import { readerSignal } from "../states"
import { useIsUsingPagesPerChapter } from "./useIsUsingPagesPerChapter"

export const useCurrentPages = ({ bookId }: { bookId?: string }) => {
  const reader = useSignalValue(readerSignal)
  const context = useObserve(() => reader?.context.state$, [reader])
  const {
    beginPageIndexInSpineItem,
    endPageIndexInSpineItem,
    beginSpineItemIndex,
    endSpineItemIndex
  } = useObserve(() => reader?.pagination.state$, [reader]) ?? {}
  const isUsingPagesPerChapter = useIsUsingPagesPerChapter({ bookId })

  if (isUsingPagesPerChapter) {
    if (context?.isUsingSpreadMode)
      return [beginPageIndexInSpineItem, endPageIndexInSpineItem] as const
    return [beginPageIndexInSpineItem] as const
  }

  if (context?.isUsingSpreadMode)
    return [beginSpineItemIndex, endSpineItemIndex] as const

  return [beginSpineItemIndex] as const
}
