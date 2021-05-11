import { ReadingItem } from ".";
import { Report } from "../../report";
import { extractObokuMetadataFromCfi } from "../cfi";
import { Context } from "../context";
import { getNumberOfPages } from "../pagination";
import { createLocator } from "./locator";

type NavigationEntry = { x: number, y: number }
type ReadingItemPosition = { x: number, y: number }

export const createNavigator = ({ context }: { context: Context }) => {
  const readingItemLocator = createLocator({ context })

  // const getNavigationForLeftPage = (currentPageIndex: number, readingItem: ReadingItem): NavigationEntry => {
  //   const currentViewport = readingItemLocator.getReadingItemPositionFromPageIndex(currentPageIndex, readingItem)

  //   const nextViewport = currentViewport - context.getPageSize().width

  //   const newPage = readingItemLocator.getReadingItemPageIndexFromPosition(nextViewport, readingItem)

  //   if (newPage !== currentPageIndex) {
  //     return { x: nextViewport, y: 0 }
  //   }

  //   return { x: currentViewport, y: 0 }
  // }

  const getNavigationForLeftPage = (position: ReadingItemPosition, readingItem: ReadingItem): NavigationEntry => {
    let nextPotentialPosition = {
      x: position.x - context.getPageSize().width,
      y: position.y
    }

    if (readingItem.isUsingVerticalWriting()) {
      nextPotentialPosition = {
        x: position.x,
        y: position.y + context.getPageSize().height
      }
    }

    return readingItemLocator.getReadingItemClosestPositionFromUnsafePosition(nextPotentialPosition, readingItem)
  }

  const getNavigationForRightPage = (position: ReadingItemPosition, readingItem: ReadingItem): NavigationEntry => {
    let nextPotentialPosition = {
      x: position.x + context.getPageSize().width,
      y: position.y
    }

    if (readingItem.isUsingVerticalWriting()) {
      nextPotentialPosition = {
        x: position.x,
        y: position.y - context.getPageSize().height
      }
    }

    return readingItemLocator.getReadingItemClosestPositionFromUnsafePosition(nextPotentialPosition, readingItem)
  }

  const getNavigationForLastPage = (readingItem: ReadingItem): NavigationEntry => {
    if (readingItem.isUsingVerticalWriting()) {
      const pageHeight = context.getPageSize().height
      const numberOfPages = getNumberOfPages(readingItem.getBoundingClientRect().height, pageHeight)
      return getNavigationForPage(numberOfPages - 1, readingItem)
    } else {
      const pageWidth = context.getPageSize().width
      const numberOfPages = getNumberOfPages(readingItem.getBoundingClientRect().width, pageWidth)
      return getNavigationForPage(numberOfPages - 1, readingItem)
    }
  }

  const getNavigationForPage = (pageIndex: number, readingItem: ReadingItem): NavigationEntry => {
    const currentViewport = readingItemLocator.getReadingItemPositionFromPageIndex(pageIndex, readingItem)

    return currentViewport
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