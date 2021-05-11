import { Context } from "../context"
import { ReadingItem } from "../readingItem"
import { createLocator as createReadingItemLocator } from "../readingItem/locator"
import { ReadingItemManager } from "../readingItemManager"

type ReadingOrderViewPosition = { x: number, y: number }
type ReadingItemPosition = { x: number, y: number }

export const createLocator = ({ readingItemManager, context }: {
  readingItemManager: ReadingItemManager,
  context: Context,
}) => {
  const readingItemLocator = createReadingItemLocator({ context })

  const getReadingItemPositionFromReadingOrderViewPosition = (position: ReadingOrderViewPosition, readingItem: ReadingItem): ReadingItemPosition => {
    const { end, start } = readingItemManager.getPositionOf(readingItem)

    /**
     * For this case the global offset move from right to left but this specific item
     * reads from left to right. This means that when the offset is at the start of the item
     * it is in fact at his end. This behavior can be observed in `haruko` about chapter.
     * @example
     * <---------------------------------------------------- global offset
     * item offset ------------------>
     * [item2 (page0 - page1 - page2)] [item1 (page1 - page0)] [item0 (page0)]
     */
    // if (context.isRTL() && itemReadingDirection === 'ltr') {
    //   return (end - readingOrderViewOffset) - context.getPageSize().width
    // }

    if (context.isRTL()) {
      return { x: (end - position.x) - context.getPageSize().width, y: position.y }
    }

    return { x: position.x - start, y: position.y }
  }

  const getReadingOrderViewPositionFromReadingItemPosition = (readingItemPosition: ReadingItemPosition, readingItem: ReadingItem): ReadingOrderViewPosition => {
    const { end, start } = readingItemManager.getPositionOf(readingItem)

    /**
     * For this case the global offset move from right to left but this specific item
     * reads from left to right. This means that when the offset is at the start of the item
     * it is in fact at his end. This behavior can be observed in `haruko` about chapter.
     * @example
     * <---------------------------------------------------- global offset
     * item offset ------------------>
     * [item2 (page0 - page1 - page2)] [item1 (page1 - page0)] [item0 (page0)]
     */
    // if (context.isRTL() && itemReadingDirection === 'ltr') {
    //   return (end - readingItemOffset) - context.getPageSize().width
    // }

    // console.warn(`getReadingOrderViewPositionFromReadingItemPosition`, { end, start, readingItemPosition.x, val: start + readingItemPosition.x })
    if (context.isRTL()) {
      return {
        x: (end - readingItemPosition.x) - context.getPageSize().width,
        y: readingItemPosition.y
      }
    }

    return {
      x: start + readingItemPosition.x,
      y: readingItemPosition.y
    }
  }

  const getReadingItemFromOffset = (offset: number) => {
    const readingItem = readingItemManager.getReadingItemAtOffset(offset)

    return readingItem
  }

  const getReadingOrderViewOffsetFromReadingItem = (readingItem: ReadingItem) => {
    return getReadingOrderViewPositionFromReadingItemPosition({ x: 0, y: 0 }, readingItem)
  }

  const getReadingOrderViewPositionFromReadingOrderAnchor = (anchor: string, readingItem: ReadingItem) => {
    const readingItemOffset = readingItemLocator.getReadingItemOffsetFromAnchor(anchor, readingItem)

    const position = getReadingOrderViewPositionFromReadingItemPosition({ x: readingItemOffset, y: 0 }, readingItem)

    return position
  }

  return {
    getReadingOrderViewPositionFromReadingItemPosition,
    getReadingOrderViewOffsetFromReadingItem,
    getReadingItemPositionFromReadingOrderViewPosition,
    getReadingItemFromOffset,
    getReadingOrderViewPositionFromReadingOrderAnchor,
  }
}