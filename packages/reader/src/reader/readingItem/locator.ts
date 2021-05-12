import { Report } from "../../report"
import { CFI, extractObokuMetadataFromCfi } from "../cfi"
import { Context } from "../context"
import { getItemOffsetFromPageIndex, getClosestValidOffsetFromApproximateOffsetInPages, getPageFromOffset, getNumberOfPages } from "../pagination"
import { ReadingItem } from "../readingItem"
import { getFirstVisibleNodeForViewport, getRangeFromNode } from "../utils/dom"

const NAMESPACE = `readingItemLocator`

type ReadingItemPosition = { x: number, y: number }

export const createLocator = ({ context }: {
  context: Context,
}) => {
  const getReadingItemPositionFromPageIndex = (pageIndex: number, readingItem: ReadingItem): ReadingItemPosition => {
    const { width: itemWidth, height: itemHeight } = readingItem.getBoundingClientRect()
    const itemReadingDirection = readingItem.getReadingDirection()

    if (readingItem.isUsingVerticalWriting()) {
      const ltrRelativeOffset = getItemOffsetFromPageIndex(context.getPageSize().height, pageIndex, itemHeight)

      return {
        x: 0,
        y: ltrRelativeOffset
      }
    }

    const ltrRelativeOffset = getItemOffsetFromPageIndex(context.getPageSize().width, pageIndex, itemWidth)

    if (itemReadingDirection === 'rtl') {
      return {
        x: (itemWidth - ltrRelativeOffset) - context.getPageSize().width,
        y: 0
      }
    }

    return {
      x: ltrRelativeOffset,
      y: 0
    }
  }

  const getReadingItemPageIndexFromPosition = (position: ReadingItemPosition, readingItem: ReadingItem) => {
    const { width: itemWidth, height: itemHeight } = readingItem.getBoundingClientRect()
    const itemReadingDirection = readingItem.getReadingDirection()
    const pageWidth = context.getPageSize().width
    const pageHeight = context.getPageSize().height

    let offsetNormalizedForLtr = Math.min(itemWidth, Math.max(0, position.x))

    if (itemReadingDirection === 'rtl') {
      offsetNormalizedForLtr = (itemWidth - offsetNormalizedForLtr) - context.getPageSize().width
    }

    if (readingItem.isUsingVerticalWriting()) {
      const numberOfPages = getNumberOfPages(itemHeight, pageHeight)

      return getPageFromOffset(position.y, pageHeight, numberOfPages)
    } else {
      const numberOfPages = getNumberOfPages(itemWidth, pageWidth)

      return getPageFromOffset(offsetNormalizedForLtr, pageWidth, numberOfPages)
    }
  }

  const getReadingItemOffsetFromAnchor = (anchor: string, readingItem: ReadingItem) => {
    const itemWidth = (readingItem.getBoundingClientRect()?.width || 0)
    const pageWidth = context.getPageSize().width
    const anchorElementBoundingRect = readingItem.getBoundingRectOfElementFromSelector(anchor)

    const offsetOfAnchor = anchorElementBoundingRect?.x || 0

    return getClosestValidOffsetFromApproximateOffsetInPages(offsetOfAnchor, pageWidth, itemWidth)
  }

  const getReadingItemOffsetFromCfi = (cfi: string, readingItem: ReadingItem) => {
    const { node, offset = 0 } = resolveCfi(cfi, readingItem) || {}

    let offsetOfNodeInReadingItem = 0

    // for some reason `img` does not work with range (x always = 0)
    if (node?.nodeName === `img` || node?.textContent === `` && node.nodeType === Node.ELEMENT_NODE) {
      offsetOfNodeInReadingItem = (node as HTMLElement).getBoundingClientRect().x
    } else if (node) {
      const range = node ? getRangeFromNode(node, offset) : undefined
      offsetOfNodeInReadingItem = range?.getBoundingClientRect().x || offsetOfNodeInReadingItem
    }

    const readingItemWidth = readingItem.getBoundingClientRect()?.width || 0
    const pageWidth = context.getPageSize().width

    const val = getClosestValidOffsetFromApproximateOffsetInPages(offsetOfNodeInReadingItem, pageWidth, readingItemWidth)

    Report.log(NAMESPACE, `getReadingItemOffsetFromCfi`, { node, offset, offsetOfNodeInReadingItem, itemOffset: val })

    return val
  }

  /**
   * @todo handle vertical
   */
  const getFirstNodeOrRangeAtPage = (pageIndex: number, readingItem: ReadingItem) => {
    const pageSize = context.getPageSize()
    const frame = readingItem.readingItemFrame?.getManipulableFrame()?.frame

    if (
      frame?.contentWindow?.document
      // very important because it is being used by next functions
      && frame.contentWindow.document.body !== null
    ) {

      const { y: left } = getReadingItemPositionFromPageIndex(pageIndex, readingItem)
      const viewport = {
        left,
        right: left + pageSize.width,
        top: 0,
        bottom: pageSize.height
      }

      const res = getFirstVisibleNodeForViewport(frame.contentWindow.document, viewport)

      return res
    }

    return undefined
  }

  const getCfi = Report.measurePerformance(`getCfi`, 10, (pageIndex: number, readingItem: ReadingItem) => {
    const nodeOrRange = getFirstNodeOrRangeAtPage(pageIndex, readingItem)
    const doc = readingItem.readingItemFrame.getManipulableFrame()?.frame?.contentWindow?.document

    const itemAnchor = `|[oboku~anchor~${encodeURIComponent(readingItem.item.id)}]`
    // because the current cfi library does not works well with offset we are just using custom
    // format and do it manually after resolving the node
    // @see https://github.com/fread-ink/epub-cfi-resolver/issues/8
    const offset = `|[oboku~offset~${nodeOrRange?.offset || 0}]`

    if (nodeOrRange && doc) {
      const cfiString = CFI.generate(nodeOrRange.node, 0, `${itemAnchor}${offset}`)

      return cfiString
    }

    return `epubcfi(/0${itemAnchor}) `
  })

  const resolveCfi = (cfiString: string | undefined, readingItem: ReadingItem) => {
    if (!cfiString) return undefined

    const { cleanedCfi, offset } = extractObokuMetadataFromCfi(cfiString)
    const cfi = new CFI(cleanedCfi, {})

    const doc = readingItem.readingItemFrame.getManipulableFrame()?.frame?.contentWindow?.document

    if (doc) {
      try {
        const { node } = cfi.resolve(doc, {})

        return { node, offset }
      } catch (e) {
        Report.error(e)
        return undefined
      }
    }

    return undefined
  }

  const getReadingItemClosestPositionFromUnsafePosition = (unsafePosition: ReadingItemPosition, readingItem: ReadingItem) => {
    const { width, height } = readingItem.getBoundingClientRect()

    const adjustedPosition = {
      x: getClosestValidOffsetFromApproximateOffsetInPages(unsafePosition.x, context.getPageSize().width, width),
      y: getClosestValidOffsetFromApproximateOffsetInPages(unsafePosition.y, context.getPageSize().height, height),
    }

    console.warn(`getReadingItemClosestPositionFromUnsafePosition`, { unsafePosition, adjustedPosition })

    return adjustedPosition
  }

  return {
    getReadingItemOffsetFromCfi,
    getReadingItemPositionFromPageIndex,
    getReadingItemOffsetFromAnchor,
    getReadingItemPageIndexFromPosition,
    getReadingItemClosestPositionFromUnsafePosition,
    getCfi,
    resolveCfi
  }
}