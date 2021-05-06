import { Context } from "../context"
import { ReadingItem } from "../readingItem"
import { ReadingItemManager } from "../readingItemManager"

export const createLocator = ({ readingItemManager, context }: {
  readingItemManager: ReadingItemManager,
  context: Context,
}) => {
  const getReadingItemOffsetFromReadingOrderViewOffset = (readingOrderViewOffset: number, readingItem: ReadingItem) => {
    const { end, start } = readingItemManager.getPositionOf(readingItem)
    const itemReadingDirection = readingItem.getReadingDirection()

    /**
     * For this case the global offset move from right to left but this specific item
     * reads from left to right. This means that when the offset is at the start of the item
     * it is in fact at his end. This behavior can be observed in `haruko` about chapter.
     * @example
     * <---------------------------------------------------- global offset
     * item offset ------------------>
     * [item2 (page0 - page1 - page2)] [item1 (page1 - page0)] [item0 (page0)]
     */
    if (context.isRTL() && itemReadingDirection === 'ltr') {
      return (end - readingOrderViewOffset) - context.getPageSize().width
    }

    return readingOrderViewOffset - start
  }

  const getReadingOrderViewOffsetFromReadingItemOffset = (readingItemOffset: number, readingItem: ReadingItem) => {
    const { end, start } = readingItemManager.getPositionOf(readingItem)
    const itemReadingDirection = readingItem.getReadingDirection()

    /**
     * For this case the global offset move from right to left but this specific item
     * reads from left to right. This means that when the offset is at the start of the item
     * it is in fact at his end. This behavior can be observed in `haruko` about chapter.
     * @example
     * <---------------------------------------------------- global offset
     * item offset ------------------>
     * [item2 (page0 - page1 - page2)] [item1 (page1 - page0)] [item0 (page0)]
     */
    if (context.isRTL() && itemReadingDirection === 'ltr') {
      return (end - readingItemOffset) - context.getPageSize().width
    }

    return start + readingItemOffset
  }

  return {
    getReadingOrderViewOffsetFromReadingItemOffset,
    getReadingItemOffsetFromReadingOrderViewOffset,
  }
}