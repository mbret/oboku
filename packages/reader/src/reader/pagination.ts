import { Subject } from "rxjs"
import { Context } from "./context"
import { ReadingItem } from "./readingItem"
import { CFI } from './cfi'
import { Report } from "../report"

export type Pagination = ReturnType<typeof createPagination>

export const createPagination = ({ context }: { context: Context }) => {
  const subject = new Subject<{ event: 'change' }>()
  let pageIndex: number | undefined
  let numberOfPages = 0
  let isAtEndOfChapter = false
  let cfi: string | undefined = undefined

  const calculateClosestOffsetFromPage = (pageIndex: number, readingItem: ReadingItem) => {
    const itemWidth = (readingItem.getBoundingClientRect()?.width || 0)
    const lastPageOffset = itemWidth - context.getPageSize().width
    const logicalOffset = (itemWidth * (pageIndex * context.getPageSize().width)) / itemWidth

    return Math.max(0, Math.min(lastPageOffset, logicalOffset))
  }

  return {
    getPageIndex() {
      return pageIndex
    },
    getNumberOfPages() {
      return numberOfPages
    },
    getIsAtEndOfChapter() {
      return isAtEndOfChapter
    },
    update: (readingItem: ReadingItem, offsetInReadingItem: number, options: { isAtEndOfChapter?: boolean } = {}) => {
      const readingItemWidth = readingItem.getBoundingClientRect()?.width || 0
      const pageWidth = context.getPageSize().width
      numberOfPages = getNumberOfPages(readingItemWidth, context.getPageSize().width)
      pageIndex = getPageFromOffset(offsetInReadingItem, pageWidth, numberOfPages)
      console.log(`Pagination`, `update with ${offsetInReadingItem}`, { readingItemWidth, pageIndex, numberOfPages })
      isAtEndOfChapter = readingItem.isContentReady() && pageIndex === (numberOfPages - 1)
      if (options.isAtEndOfChapter !== undefined) {
        isAtEndOfChapter = options.isAtEndOfChapter
      }

      // @todo update pagination cfi whenever iframe is ready (cause even offset may not change but we still need to get the iframe for cfi)
      // @todo update cfi also whenever a resize occurs in the iframe
      // - load
      // - font loaded
      // - resize
      // future changes would potentially only be resize (easy to track) and font size family change.
      // to track that we can have a hidden text element and track it and send event back
      cfi = readingItem.getCfi(offsetInReadingItem)

      Report.log(`pagination`, `cfi`, cfi, readingItem.resolveCfi(cfi))
      // if (!!doc) {
      //   const s = readingItem.getFirstNodeAtOffset(offsetInReadingItem)
      //   if (s) {
      //     // const cfi = CFI.generate(readingItem.getFirstNodeAtOffset(), 0, `[${readingItem.item.id}]`)
      //     // const cfi = CFI.generate(s)
      //     // const cfi = `epubcfi(/6/4[spi_ad]!/4/1:0)`
      //     // const cfi = `epubcfi(/6/4)`
      //     // const cfi = `epubcfi(/4/2)`
      //     const cfi = `epubcfi(/2)`
      //     console.log(s, cfi, CFI.generate(s))

      //     const newCfi = new CFI(CFI.generate(s), {})
      //     // const newCfi = new CFI('epubcfi(/6/4[spi_ad]!/4/1:0)')
      //     console.log(newCfi)

      //     // console.log(doc)
      //     // setTimeout(() => {
      //     // console.log(newCfi.res(doc, newCfi.parts))
      //     // console.log(newCfi.resolveURI(0, doc))
      //     newCfi.resolve(doc, () => doc, {}).then((r) => {
      //       console.log(`located node`, r.node)
      //     }).catch(console.error)
      //     // }, 1000)
      //   }
      // }
      subject.next({ event: 'change' })
    },
    getCfi() {
      return cfi
    },
    getClosestValidOffsetFromOffset: (offsetInReadingItem: number, readingItem: ReadingItem) => {
      const readingItemWidth = readingItem.getBoundingClientRect()?.width || 0
      const pageWidth = context.getPageSize().width
      const numberOfPages = getNumberOfPages(readingItemWidth, context.getPageSize().width)

      console.log(`calculatePageFromOffset`, { readingItemWidth, pageWidth, numberOfPages })

      return getClosestValidOffsetFromOffset(offsetInReadingItem, pageWidth, numberOfPages)
    },
    calculateClosestOffsetFromPage,
    $: subject.asObservable()
  }
}

const getNumberOfPages = (readingItemWidth: number, pageWidth: number) =>
  readingItemWidth / pageWidth

const getPageFromOffset = (offset: number, pageWidth: number, numberOfPages: number) => {
  const offsetValues = [...Array(numberOfPages)].map((_, i) => i * pageWidth)

  return Math.max(0, offsetValues.findIndex(offsetRange => offset < (offsetRange + pageWidth)))
}

const getClosestValidOffsetFromOffset = (offset: number, pageWidth: number, numberOfPages: number) => {
  const offsetValues = [...Array(numberOfPages)].map((_, i) => i * pageWidth)

  return offsetValues.find(offsetRange => offset < (offsetRange + pageWidth)) || 0
}