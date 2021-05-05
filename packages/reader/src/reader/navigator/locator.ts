import { Context } from "../context"
import { getItemOffsetFromPageIndex, getClosestValidOffsetFromApproximateOffsetInPages } from "../pagination"
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

  const getReadingItemOffsetFromPageIndex = (pageIndex: number, readingItem: ReadingItem) => {
    const itemWidth = (readingItem.getBoundingClientRect()?.width || 0)

    return getItemOffsetFromPageIndex(context.getPageSize().width, pageIndex, itemWidth)
  }

  const getReadingItemOffsetFromAnchor = (anchor: string, readingItem: ReadingItem) => {
    const itemWidth = (readingItem.getBoundingClientRect()?.width || 0)
    const pageWidth = context.getPageSize().width
    const anchorElementBoundingRect = readingItem.getBoundingRectOfElementFromSelector(anchor)

    // @todo writing-direction
    const offsetOfAnchor = anchorElementBoundingRect?.x || 0

    return getClosestValidOffsetFromApproximateOffsetInPages(offsetOfAnchor, pageWidth, itemWidth)
  }

  const getReadingItemOffsetFromCfi = (cfi: string, readingItem: ReadingItem) => {
    const { node, offset = 0 } = readingItem.resolveCfi(cfi) || {}

    // @todo writing-direction
    let offsetOfNodeInReadingItem = 0

    // for some reason `img` does not work with range (x always = 0)
    if (node?.nodeName === `img`) {
      offsetOfNodeInReadingItem = (node as HTMLElement).getBoundingClientRect().x
    } else {
      const range = node ? getRangeFromNode(node, offset) : undefined
      offsetOfNodeInReadingItem = range?.getBoundingClientRect().x || offsetOfNodeInReadingItem
    }

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

  return {
    getReadingOrderViewOffsetFromReadingItemOffset,
    getReadingItemOffsetFromReadingOrderViewOffset,
    getReadingItemOffsetFromCfi,
    getReadingItemOffsetFromPageIndex,
    getReadingItemOffsetFromAnchor,
  }
}