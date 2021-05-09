import { Report } from "../../report"
import { CFI, extractObokuMetadataFromCfi } from "../cfi"
import { Context } from "../context"
import { getItemOffsetFromPageIndex, getClosestValidOffsetFromApproximateOffsetInPages, getPageFromOffset, getNumberOfPages } from "../pagination"
import { ReadingItem } from "../readingItem"
import { getFirstVisibleNodeForViewport, getRangeFromNode } from "../utils/dom"

const NAMESPACE = `readingItemLocator`

export const createLocator = ({ context }: {
  context: Context,
}) => {
  const getReadingItemOffsetFromPageIndex = (pageIndex: number, readingItem: ReadingItem) => {
    const itemWidth = readingItem.getBoundingClientRect().width
    const itemReadingDirection = readingItem.getReadingDirection()

    const ltrRelativeOffset = getItemOffsetFromPageIndex(context.getPageSize().width, pageIndex, itemWidth)

    if (itemReadingDirection === 'rtl') {
      return (itemWidth - ltrRelativeOffset) - context.getPageSize().width
    }

    return ltrRelativeOffset
  }

  const getReadingItemPageIndexFromOffset = (offset: number, readingItem: ReadingItem) => {
    const itemWidth = readingItem.getBoundingClientRect().width
    const itemReadingDirection = readingItem.getReadingDirection()
    const pageWidth = context.getPageSize().width
    const numberOfPages = getNumberOfPages(itemWidth, pageWidth)

    let offsetNormalizedForLtr = Math.min(itemWidth, Math.max(0, offset))

    if (itemReadingDirection === 'rtl') {
      offsetNormalizedForLtr = (itemWidth - offsetNormalizedForLtr) - context.getPageSize().width
    }

    const pageIndex = getPageFromOffset(offsetNormalizedForLtr, pageWidth, numberOfPages)

    console.warn(`getReadingItemPageIndexFromOffset`, {
      pageIndex,
      offset: Math.min(itemWidth, Math.max(0, offset)),
      offsetNormalizedForLtr,
      pageWidth,
      itemWidth,
      numberOfPages
    })

    return pageIndex
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

  const getFirstNodeOrRangeAtPage = (pageIndex: number, readingItem: ReadingItem) => {
    const pageSize = context.getPageSize()
    const frame = readingItem.readingItemFrame?.getFrameElement()

    if (
      frame?.contentWindow?.document
      // very important because it is being used by next functions
      && frame.contentWindow.document.body !== null
    ) {

      const left = getReadingItemOffsetFromPageIndex(pageIndex, readingItem)
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
    const doc = readingItem.readingItemFrame.getFrameElement()?.contentWindow?.document

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

    const doc = readingItem.readingItemFrame.getFrameElement()?.contentWindow?.document

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

  const getReadingItemClosestOffsetFromUnsafeOffet = (unsafeOffset: number, readingItem: ReadingItem) => { 
    const itemWidth = (readingItem.getBoundingClientRect()?.width || 0)
    const pageWidth = context.getPageSize().width

    return getClosestValidOffsetFromApproximateOffsetInPages(unsafeOffset, pageWidth, itemWidth)
  }

  return {
    getReadingItemOffsetFromCfi,
    getReadingItemOffsetFromPageIndex,
    getReadingItemOffsetFromAnchor,
    getReadingItemPageIndexFromOffset,
    getReadingItemClosestOffsetFromUnsafeOffet,
    getCfi,
    resolveCfi
  }
}