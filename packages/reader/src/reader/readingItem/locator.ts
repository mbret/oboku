import { Context } from "../context"
import { getItemOffsetFromPageIndex, getClosestValidOffsetFromApproximateOffsetInPages } from "../pagination"
import { ReadingItem } from "../readingItem"
import { getRangeFromNode } from "../utils/dom"

export const createLocator = ({ context }: {
  context: Context,
}) => {
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

  return {
    getReadingItemOffsetFromCfi,
    getReadingItemOffsetFromPageIndex,
    getReadingItemOffsetFromAnchor,
  }
}