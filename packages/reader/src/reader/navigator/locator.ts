import { Context } from "../context"
import { getReadingItemOffsetFromPageIndex, getClosestValidOffsetFromApproximateOffsetInPages } from "../pagination"
import { ReadingItem } from "../readingItem"
import { ReadingItemManager } from "../readingItemManager"
import { getRangeFromNode } from "../utils/dom"

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

  const getReadingItemOffsetFromCfi = (cfi: string, readingItem: ReadingItem) => {
    const { node, offset = 0 } = readingItem.resolveCfi(cfi) || {}
    const range = node ? getRangeFromNode(node, offset) : undefined
    const offsetOfNodeInReadingItem = range?.getBoundingClientRect().x || 0
    const readingItemWidth = readingItem.getBoundingClientRect()?.width || 0
    const pageWidth = context.getPageSize().width

    return getClosestValidOffsetFromApproximateOffsetInPages(offsetOfNodeInReadingItem, pageWidth, readingItemWidth)
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

  const getReadingOrderViewOffsetFromReadingItemPage = (pageIndex: number, readingItem: ReadingItem) => {
    const itemWidth = (readingItem.getBoundingClientRect()?.width || 0)
    const readingItemOffset = getReadingItemOffsetFromPageIndex(context.getPageSize().width, pageIndex, itemWidth)

    return getReadingOrderViewOffsetFromReadingItemOffset(readingItemOffset, readingItem)
  }

  return {
    getReadingOrderViewOffsetFromReadingItemPage,
    getReadingOrderViewOffsetFromReadingItemOffset,
    getReadingItemOffsetFromReadingOrderViewOffset,
    getReadingItemOffsetFromCfi,
  }
}