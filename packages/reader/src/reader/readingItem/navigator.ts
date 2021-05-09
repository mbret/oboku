import { ReadingItem } from ".";
import { Report } from "../../report";
import { extractObokuMetadataFromCfi } from "../cfi";
import { Context } from "../context";
import { getNumberOfPages } from "../pagination";
import { createLocator } from "./locator";

type NavigationEntry = { x: number, y: number }

export const createNavigator = ({ context }: { context: Context }) => {
  const readingItemLocator = createLocator({ context })

  // const getNavigationForLeftPage = (currentPageIndex: number, readingItem: ReadingItem): NavigationEntry => {
  //   const currentViewport = readingItemLocator.getReadingItemOffsetFromPageIndex(currentPageIndex, readingItem)

  //   const nextViewport = currentViewport - context.getPageSize().width

  //   const newPage = readingItemLocator.getReadingItemPageIndexFromOffset(nextViewport, readingItem)

  //   if (newPage !== currentPageIndex) {
  //     return { x: nextViewport, y: 0 }
  //   }

  //   return { x: currentViewport, y: 0 }
  // }

  const getNavigationForLeftPage = (fromOffset: number, readingItem: ReadingItem): NavigationEntry => {
    const nextPotentialOffset = fromOffset - context.getPageSize().width
    const nextValidPotentialOffset = readingItemLocator.getReadingItemClosestOffsetFromUnsafeOffet(nextPotentialOffset, readingItem)

    return { x: nextValidPotentialOffset, y: 0 }
  }

  const getNavigationForRightPage = (fromOffset: number, readingItem: ReadingItem): NavigationEntry => {
    const nextPotentialOffset = fromOffset + context.getPageSize().width
    const nextValidPotentialOffset = readingItemLocator.getReadingItemClosestOffsetFromUnsafeOffet(nextPotentialOffset, readingItem)

    return { x: nextValidPotentialOffset, y: 0 }
  }

  const getNavigationForLastPage = (readingItem: ReadingItem): NavigationEntry => {
    const pageWidth = context.getPageSize().width
    const numberOfPages = getNumberOfPages(readingItem.getBoundingClientRect().width, pageWidth)

    return getNavigationForPage(numberOfPages - 1, readingItem)
  }

  const getNavigationForPage = (pageIndex: number, readingItem: ReadingItem): NavigationEntry => {
    const currentViewport = readingItemLocator.getReadingItemOffsetFromPageIndex(pageIndex, readingItem)

    return { x: currentViewport, y: 0 }
  }

  const getNavigationForCfi = (cfi: string, readingItem: ReadingItem) => {
    const readingItemOffset = readingItemLocator.getReadingItemOffsetFromCfi(cfi, readingItem)

    return { x: readingItemOffset, y: 0 }
  }

  return {
    getNavigationForLeftPage,
    getNavigationForRightPage,
    getNavigationForLastPage,
    getNavigationForPage,
    getNavigationForCfi,
  }
}