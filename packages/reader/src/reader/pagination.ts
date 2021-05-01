import { Subject } from "rxjs"
import { Context } from "./context"
import { ReadingItem } from "./readingItem"
import { Report } from "../report"

export type Pagination = ReturnType<typeof createPagination>

export const createPagination = ({ context }: { context: Context }) => {
  const subject = new Subject<{ event: 'change' }>()
  let pageIndex: number | undefined
  let numberOfPages = 0
  // let isAtEndOfChapter = false
  let cfi: string | undefined = undefined

  const getPageFromOffset = (offset: number, pageWidth: number, numberOfPages: number) => {
    const offsetValues = [...Array(numberOfPages)].map((_, i) => i * pageWidth)
  
    return Math.max(0, offsetValues.findIndex(offsetRange => offset < (offsetRange + pageWidth)))
  }

  return {
    getPageIndex() {
      return pageIndex
    },
    getNumberOfPages() {
      return numberOfPages
    },
    // getIsAtEndOfChapter() {
    //   return isAtEndOfChapter
    // },
    update: (readingItem: ReadingItem, offsetInReadingItem: number, options: { isAtEndOfChapter: boolean, shouldUpdateCfi: boolean }) => {
      const readingItemWidth = readingItem.getBoundingClientRect()?.width || 0
      const pageWidth = context.getPageSize().width
      numberOfPages = getNumberOfPages(readingItemWidth, context.getPageSize().width)
      pageIndex = getPageFromOffset(offsetInReadingItem, pageWidth, numberOfPages)
      // console.log(`Pagination`, `update with ${offsetInReadingItem}`, { readingItemWidth, pageIndex, numberOfPages })
      // isAtEndOfChapter = readingItem.isContentReady() && pageIndex === (numberOfPages - 1)
      // if (options.isAtEndOfChapter) {
      //   isAtEndOfChapter = options.isAtEndOfChapter
      // }

      // @todo update pagination cfi whenever iframe is ready (cause even offset may not change but we still need to get the iframe for cfi)
      // @todo update cfi also whenever a resize occurs in the iframe
      // - load
      // - font loaded
      // - resize
      // future changes would potentially only be resize (easy to track) and font size family change.
      // to track that we can have a hidden text element and track it and send event back
      if (options.shouldUpdateCfi) {
        cfi = readingItem.getCfi(pageIndex)
        Report.log(`pagination`, `cfi`, pageIndex, cfi)
      }

      subject.next({ event: 'change' })
    },
    getCfi() {
      return cfi
    },
    $: subject.asObservable()
  }
}

export const getReadingItemOffsetFromPageIndex = (pageWidth: number, pageIndex: number, itemWidth: number) => {
  const lastPageOffset = itemWidth - pageWidth
  const logicalOffset = (itemWidth * (pageIndex * pageWidth)) / itemWidth

  return Math.max(0, Math.min(lastPageOffset, logicalOffset))
}

export const getNumberOfPages = (itemWidth: number, pageWidth: number) => {
  if ((pageWidth || 0) === 0 || (itemWidth || 0) === 0) return 1
  return Math.max(1, itemWidth / pageWidth)
}

export const getClosestValidOffsetFromApproximateOffsetInPages = (offset: number, pageWidth: number, itemWidth: number) => {
  const numberOfPages = getNumberOfPages(itemWidth, pageWidth)
  const offsetValues = [...Array(numberOfPages)].map((_, i) => i * pageWidth)

  return offsetValues.find(offsetRange => offset < (offsetRange + pageWidth)) || 0
}