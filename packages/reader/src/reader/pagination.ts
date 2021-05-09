import { Subject } from "rxjs"
import { Context } from "./context"
import { ReadingItem } from "./readingItem"
import { Report } from "../report"
import { createLocator } from "./readingItem/locator"
import { createPaginator } from "./readingItem/paginator"

export type Pagination = ReturnType<typeof createPagination>

export const createPagination = ({ context }: { context: Context }) => {
  const subject = new Subject<{ event: 'change' }>()
  const readingItemLocator = createLocator({ context })
  const readingItemPaginator = createPaginator({ context })
  let pageIndex: number | undefined
  let numberOfPages = 0
  // let isAtEndOfChapter = false
  let cfi: string | undefined = undefined

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
    update: (
      readingItem: ReadingItem,
      offsetInReadingItem: number,
      options: { 
        isAtEndOfChapter?: boolean, 
        shouldUpdateCfi?: boolean,
        cfi?: string
       }
    ) => {
      numberOfPages = readingItemPaginator.getReadingItemNumberOfPages(readingItem)
      // pageIndex = getPageFromOffset(offsetInReadingItem, pageWidth, numberOfPages)
      pageIndex = readingItemLocator.getReadingItemPageIndexFromOffset(offsetInReadingItem, readingItem)
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
      if (options.cfi === undefined) {
        cfi = readingItemLocator.getCfi(pageIndex, readingItem)
        Report.log(`pagination`, `cfi`, pageIndex, cfi)
      } else {
        cfi = options.cfi
      }

      subject.next({ event: 'change' })
    },
    getCfi() {
      return cfi
    },
    $: subject.asObservable()
  }
}

export const getPageFromOffset = (offset: number, pageWidth: number, numberOfPages: number) => {
  const offsetValues = [...Array(numberOfPages)].map((_, i) => i * pageWidth)

  if (offset <= 0) return 0

  if (offset >= (numberOfPages * pageWidth)) return numberOfPages - 1

  return Math.max(0, offsetValues.findIndex(offsetRange => offset < (offsetRange + pageWidth)))
}

export const getItemOffsetFromPageIndex = (pageWidth: number, pageIndex: number, itemWidth: number) => {
  const lastPageOffset = itemWidth - pageWidth
  const logicalOffset = (itemWidth * (pageIndex * pageWidth)) / itemWidth

  return Math.max(0, Math.min(lastPageOffset, logicalOffset))
}

export const getNumberOfPages = (itemWidth: number, pageWidth: number) => {
  if ((pageWidth || 0) === 0 || (itemWidth || 0) === 0) return 1
  return Math.floor(Math.max(1, itemWidth / pageWidth))
}


export const getClosestValidOffsetFromApproximateOffsetInPages = (offset: number, pageWidth: number, itemWidth: number) => {
  const numberOfPages = getNumberOfPages(itemWidth, pageWidth)
  const offsetValues = [...Array(numberOfPages)].map((_, i) => i * pageWidth)

  if (offset >= (numberOfPages * pageWidth)) return offsetValues[offsetValues.length - 1] || 0

  return offsetValues.find(offsetRange => offset < (offsetRange + pageWidth)) || 0
}