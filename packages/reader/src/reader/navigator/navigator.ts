import { Report } from "../../report"
import { extractObokuMetadataFromCfi } from "../cfi"
import { Context } from "../context"
import { Pagination, getNumberOfPages } from "../pagination"
import { ReadingItemManager } from "../readingItemManager"
import { createLocator } from "./locator"

export const createNavigator = ({ readingItemManager, context, pagination, element }: {
  readingItemManager: ReadingItemManager,
  pagination: Pagination,
  context: Context,
  element: HTMLElement
}) => {
  const locator = createLocator({ context, readingItemManager })
  let lastUserExpectedNavigation: { type: 'turned-prev-chapter' } | { type: 'navigate-from-cfi', data: string } | undefined = undefined

  const adjustOffset = (offset: number) => {
    if (context.isRTL()) {
      element.style.transform = `translateX(${offset}px)`
    } else {
      element.style.transform = `translateX(-${offset}px)`
    }
  }

  const getCurrentOffset = () => Math.abs(element.getBoundingClientRect().x)

  const turnLeft = ({ allowReadingItemChange = true }: { allowReadingItemChange?: boolean } = {}) => {
    // console.warn('turnLeft')
    const currentXoffset = getCurrentOffset()
    const nextPosition = context.isRTL()
      ? currentXoffset + context.getPageSize().width
      : currentXoffset - context.getPageSize().width

    // console.warn(`turnLeft`, { currentXoffset, nextPosition })
    navigateToOffsetOrCfi(nextPosition, { allowReadingItemChange })
  }

  const turnRight = ({ allowReadingItemChange = true }: { allowReadingItemChange?: boolean } = {}) => {
    const currentXoffset = getCurrentOffset()
    const nextPosition = context.isRTL()
      ? currentXoffset - context.getPageSize().width
      : currentXoffset + context.getPageSize().width
    navigateToOffsetOrCfi(nextPosition, { allowReadingItemChange })
  }

  const goToPageOfCurrentChapter = (pageIndex: number) => {
    // console.log(`goToPageOfCurrentChapter`, pageIndex, readingItemManager.getFocusedReadingItem())
    const readingItem = readingItemManager.getFocusedReadingItem()
    if (readingItem) {
      const newOffset = locator.getReadingOrderViewOffsetFromReadingItemPage(pageIndex, readingItem)
      navigateToOffsetOrCfi(newOffset)
    }
  }

  /**
   * This method always starts from beginning of item unless a cfi is provided
   */
  const goTo = (spineIndexOrIdOrCfi: number | string) => {
    let offsetOfReadingItem: number | undefined = undefined

    // cfi
    if (typeof spineIndexOrIdOrCfi === `string` && spineIndexOrIdOrCfi.startsWith(`epubcfi`)) {
      navigateToOffsetOrCfi(spineIndexOrIdOrCfi)
    } else {
      const readingItem = readingItemManager.get(spineIndexOrIdOrCfi)
      offsetOfReadingItem = readingItem ? readingItemManager.getPositionOf(readingItem).start : 0
      navigateToOffsetOrCfi(offsetOfReadingItem || 0, { startOfReadingItem: true })
    }
  }

  /**
   * @todo optimize this function to not being called several times
   */
  const navigateToOffsetOrCfi = (offsetOrCfi: number | string, { allowReadingItemChange, startOfReadingItem }: {
    allowReadingItemChange?: boolean,
    startOfReadingItem?: boolean
  } = {}) => {
    let offset = typeof offsetOrCfi === `number` ? offsetOrCfi : 0
    const latestReadingItem = readingItemManager.get(readingItemManager.getLength() - 1)
    const distanceOfLastReadingItem = readingItemManager.getPositionOf(latestReadingItem || 0)
    const maximumOffset = distanceOfLastReadingItem.end - context.getPageSize().width
    const currentReadingItem = readingItemManager.getFocusedReadingItem()
    let potentialNewReadingItem = readingItemManager.getReadingItemAtOffset(offset) || readingItemManager.get(0)

    // prevent to go outside of edges
    if (offset < 0 || (offset > maximumOffset)) {
      return
    }

    /**
     * handle cfi case.
     * We lookup the offset of the correct reading item, then we try to lookup the node.
     * There is a high change the iframe is not ready yet. This is why the cfi will mostly 
     * be adjusted later. At least we navigate and focus the right reading item
     */
    if (typeof offsetOrCfi === `string`) {
      const { itemId } = extractObokuMetadataFromCfi(offsetOrCfi)
      if (!itemId) {
        Report.warn(`ReadingOrderView`, `unable to extract item id from cfi ${offsetOrCfi}`)
      } else {
        const { itemId } = extractObokuMetadataFromCfi(offsetOrCfi)
        potentialNewReadingItem = (itemId ? readingItemManager.get(itemId) : undefined) || readingItemManager.get(0)
        if (potentialNewReadingItem) {
          offset = locator.getReadingItemOffsetFromCfi(offsetOrCfi, potentialNewReadingItem)
        } else {
          Report.warn(`ReadingOrderView`, `unable to detect item id from cfi ${offsetOrCfi}`)
        }
      }
    }

    const newReadingItem = potentialNewReadingItem !== currentReadingItem ? potentialNewReadingItem : currentReadingItem
    const readingItemHasChanged = newReadingItem !== currentReadingItem

    if (!newReadingItem) return

    const newReadingItemIsBeforeCurrent = !readingItemManager.isAfter(newReadingItem, currentReadingItem || newReadingItem)

    if (readingItemHasChanged && allowReadingItemChange === false) {
      return
    }

    adjustOffset(offset)

    const offsetInCurrentReadingItem = locator.getReadingItemOffsetFromReadingOrderViewOffset(offset, newReadingItem)

    if (currentReadingItem !== undefined && readingItemHasChanged && newReadingItemIsBeforeCurrent && !startOfReadingItem) {
      lastUserExpectedNavigation = { type: 'turned-prev-chapter' }
    } else if (typeof offsetOrCfi === `string`) {
      lastUserExpectedNavigation = { type: 'navigate-from-cfi', data: offsetOrCfi }
    } else {
      lastUserExpectedNavigation = undefined
    }

    // console.warn(`navigateToOffsetOrCfi`, { newReadingItem, offsetOrCfi, lastUserExpectedNavigation })

    pagination.update(newReadingItem, offsetInCurrentReadingItem, {
      isAtEndOfChapter: false,
      shouldUpdateCfi: lastUserExpectedNavigation?.type !== 'navigate-from-cfi'
    })

    if (readingItemHasChanged) {
      readingItemManager.focus(newReadingItem)
    }
  }

  /**
   * Verify that current offset is within the current reading item and is at 
   * desired pagination.
   * If it is not, then we adjust the offset.
   * The offset could be wrong in the case of there has been re-layout.
   * In this case we always need to make sure to be synchronized with pagination.
   * Pagination is in theory always right because when we move the offset we directly update
   * the pagination. It's after, when re-layout happens for various reason that the page can be at
   * the wrong offset
   * @todo this is being called a lot, try to optimize
   */
  const adjustReadingOffsetPosition = ({ shouldAdjustCfi }: { shouldAdjustCfi: boolean }) => {
    const readingItem = readingItemManager.getFocusedReadingItem()

    if (!readingItem) return

    const currentXoffset = getCurrentOffset()
    const lastCfi = pagination.getCfi()
    const pageWidth = context.getPageSize().width
    let expectedReadingOrderViewOffset = currentXoffset
    let offsetInReadingItem = 0

    // console.warn(`adjustPositionForCurrentPagination`, { lastUserExpectedNavigation })

    /**
     * When `navigate-from-cfi` we always try to retrieve offset from cfi node and navigate
     * to there
     */
    if (lastUserExpectedNavigation?.type === 'navigate-from-cfi') {
      offsetInReadingItem = locator.getReadingItemOffsetFromCfi(lastUserExpectedNavigation.data, readingItem)
      expectedReadingOrderViewOffset = locator.getReadingOrderViewOffsetFromReadingItemOffset(offsetInReadingItem, readingItem)
    } else if (lastUserExpectedNavigation?.type === 'turned-prev-chapter') {
      /**
       * When `turned-prev-chapter` we always try to get the offset of the last page, that way
       * we ensure reader is always redirected to last page
       */
      const numberOfPages = getNumberOfPages(readingItem.getBoundingClientRect().width, pageWidth)
      expectedReadingOrderViewOffset = locator.getReadingOrderViewOffsetFromReadingItemPage(numberOfPages - 1, readingItem)
      offsetInReadingItem = locator.getReadingItemOffsetFromReadingOrderViewOffset(expectedReadingOrderViewOffset, readingItem)
      // console.warn(`adjustPositionForCurrentPagination`, { lastUserExpectedNavigation, numberOfPages, expectedReadingOrderViewOffset, offsetInReadingItem })
    } else if (lastCfi) {
      /**
       * When there is no last navigation then we first look for any existing CFI. If there is a cfi we try to retrieve
       * the offset and navigate the user to it
       */
      offsetInReadingItem = locator.getReadingItemOffsetFromCfi(lastCfi, readingItem)
      expectedReadingOrderViewOffset = locator.getReadingOrderViewOffsetFromReadingItemOffset(offsetInReadingItem, readingItem)
    } else {
      /**
       * Last resort case, there is no CFI so we check the current page and try to navigate to the closest one
       */
      // @todo get x of first visible element and try to get the page for this element
      // using the last page is not accurate since we could have less pages
      const currentPageIndex = pagination.getPageIndex() || 0
      expectedReadingOrderViewOffset = locator.getReadingOrderViewOffsetFromReadingItemPage(currentPageIndex, readingItem)
      offsetInReadingItem = locator.getReadingItemOffsetFromReadingOrderViewOffset(expectedReadingOrderViewOffset, readingItem)
    }

    if (expectedReadingOrderViewOffset !== currentXoffset) {
      Report.log(`ReadingOrderView`, `adjustPositionForCurrentPagination`, `current offset ${currentXoffset} is desynchronized with expected offset ${expectedReadingOrderViewOffset} and will be updated`)
      adjustOffset(expectedReadingOrderViewOffset)
    }

    // because we adjusted the position, the offset may have changed and with it current page, etc
    // because this is an adjustment we do not want to update the cfi (anchor)
    // unless it has not been set yet or it is a basic /0 node
    const shouldUpdateCfi = lastCfi === undefined
      ? true
      : lastCfi?.startsWith(`epubcfi(/0`) || shouldAdjustCfi

    pagination.update(readingItem, offsetInReadingItem, { shouldUpdateCfi, isAtEndOfChapter: false })
  }

  return {
    adjustOffset,
    getCurrentOffset,
    turnLeft,
    turnRight,
    goTo,
    goToPageOfCurrentChapter,
    adjustReadingOffsetPosition,
  }
}