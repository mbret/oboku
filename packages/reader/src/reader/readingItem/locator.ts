import { Report } from "../../report"
import { CFI, extractObokuMetadataFromCfi } from "../cfi"
import { Context } from "../context"
import { getItemOffsetFromPageIndex, getClosestValidOffsetFromApproximateOffsetInPages, getPageFromOffset, getNumberOfPages } from "../pagination"
import { ReadingItem } from "../readingItem"
import { getFirstVisibleNodeForViewport, getRangeFromNode } from "../utils/dom"

export const createLocator = ({ context }: {
  context: Context,
}) => {
  const getReadingItemOffsetFromPageIndex = (pageIndex: number, readingItem: ReadingItem) => {
    const itemWidth = readingItem.getBoundingClientRect().width
    const itemReadingDirection = readingItem.getReadingDirection()

    const relativeOffset = getItemOffsetFromPageIndex(context.getPageSize().width, pageIndex, itemWidth)

    if (itemReadingDirection === 'rtl') {
      return (itemWidth - relativeOffset) - context.getPageSize().width
    }

    return relativeOffset
  }

  const getReadingItemPageIndexFromOffset = (offset: number, readingItem: ReadingItem) => {
    const itemWidth = readingItem.getBoundingClientRect().width
    const itemReadingDirection = readingItem.getReadingDirection()
    const pageWidth = context.getPageSize().width
    const numberOfPages = getNumberOfPages(itemWidth, pageWidth)

    let offsetNormalizedForLtr = offset

    if (itemReadingDirection === 'rtl') {
      offsetNormalizedForLtr = (itemWidth - offset) - context.getPageSize().width
    }

    const pageIndex = getPageFromOffset(offsetNormalizedForLtr, pageWidth, numberOfPages)

    return pageIndex
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
    const { node, offset = 0 } = resolveCfi(cfi, readingItem) || {}

    // @todo writing-direction
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

    console.warn(`getReadingItemOffsetFromCfi`, { node, offset, offsetOfNodeInReadingItem, itemOffset: val })

    return val
  }

  const getFirstNodeOrRangeAtPage = (pageIndex: number, readingItem: ReadingItem) => {
    const pageSize = context.getPageSize()
    const frame = readingItem.readingItemFrame?.getFrameElement()

    const yOffset = 0 + context.getVerticalMargin()
    // return frame?.contentDocument?.body.childNodes[0]

    // return frame?.contentWindow?.document.caretRangeFromPoint(offset, 0).startContainer
    if (
      frame?.contentWindow?.document
      // very important because it is being used by next functions
      && frame.contentWindow.document.body !== null
    ) {

      const left = getReadingItemOffsetFromPageIndex(pageIndex, readingItem)
      const viewport = {
        // left: pageIndex * pageSize.width,
        left,
        // right: (pageIndex * pageSize.width) + pageSize.width,
        right: left + pageSize.width,
        top: 0,
        bottom: pageSize.height
      }

      // console.warn(`getFirstNodeOrRangeAtPage`, viewport)
      const res = getFirstVisibleNodeForViewport(frame.contentWindow.document, viewport)

      // const res = getFirstVisibleNodeFromPoint(frame?.contentWindow?.document, offsetInReadingItem, yOffset)


      // if (res && `offsetNode` in res) {

      //   return { node: res.offsetNode, offset: 0 }
      // }
      // if (res && `startContainer` in res) {
      //   return { node: res.startContainer, offset: res.startOffset }
      // }

      return res
    }
    // if (frame) {
    //   const element = Array.from(frame.contentWindow?.document.body.children || []).find(children => {
    //     const { x, width } = children.getBoundingClientRect()

    //     return (x + width) > offset
    //   })

    //   return element?.children[0]
    // }

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

    console.warn(`getCfi`, { nodeOrRange })
    if (nodeOrRange && doc) {
      const cfiString = CFI.generate(nodeOrRange.node, 0, `${itemAnchor}${offset}`)
      // console.log('FOOO', CFI.generate(nodeOrRange.startContainer, nodeOrRange.startOffset))

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
        // console.warn('FIII', cleanedCfi, cfi)
        // console.log('FIII', (new CFI('epubcfi(/2/4/2[_preface]/10/1:175[oboku:id-id2632344]', {})).resolve(doc, {}))
        // const { cleanedCfi: foo, itemId } = extractObokuMetadataFromCfi('epubcfi(/2/4/2[I_book_d1e1]/14/2[id2602563]/4/1:190|[oboku:id-id2442754])')
        // const { cleanedCfi: foo, itemId } = extractObokuMetadataFromCfi('epubcfi(/2/4/2[I_book_d1e1]/14/2[id2602563]/4/1:100|[oboku:id-id2442754])')
        // const cfiObject = (new CFI(foo, {}))
        // const resolve = cfiObject.resolve(doc, {})
        // console.warn('FIII', foo, (new CFI(foo, {})), resolve.node, resolve)
        const { node } = cfi.resolve(doc, {})

        // console.warn(cleanedCfi, cfi.resolve(doc, {}), offset)

        return { node, offset }
      } catch (e) {
        Report.error(e)
        return undefined
      }
    }

    return undefined
  }

  return {
    getReadingItemOffsetFromCfi,
    getReadingItemOffsetFromPageIndex,
    getReadingItemOffsetFromAnchor,
    getReadingItemPageIndexFromOffset,
    getCfi,
    resolveCfi
  }
}