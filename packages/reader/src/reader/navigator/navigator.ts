import { Report } from "../../report"
import { extractObokuMetadataFromCfi } from "../cfi"
import { Context } from "../context"
import { Pagination, getNumberOfPages } from "../pagination"
import { ReadingItemManager } from "../readingItemManager"
import { createLocator } from "./locator"
import { createLocator as createReadingItemLocator } from "../readingItem/locator"
import { ReadingItem } from "../readingItem"

const NAMESPACE = `navigator`

export const createNavigator = ({ readingItemManager, context, pagination, element }: {
  readingItemManager: ReadingItemManager,
  pagination: Pagination,
  context: Context,
  element: HTMLElement
}) => {
  const locator = createLocator({ context, readingItemManager })
  const readingItemLocator = createReadingItemLocator({ context })
  let lastUserExpectedNavigation:
    | undefined
    // always adjust at the first page
    | { type: 'navigate-from-previous-item' }
    // always adjust at the last page
    | { type: 'navigate-from-next-item' }
    // always adjust using this cfi
    | { type: 'navigate-from-cfi', data: string }
    // always adjust using this anchor
    | { type: 'navigate-from-anchor', data: string }
    = undefined

  const adjustReadingOffset = (offset: number) => {
    if (context.isRTL()) {
      element.style.transform = `translateX(${offset}px)`
    } else {
      element.style.transform = `translateX(-${offset}px)`
    }
  }

  const getCurrentOffset = () => Math.floor(Math.abs(element.getBoundingClientRect().x))

  const resolveReadingNavigationFromReadingOffset = (newOffset: number, { allowReadingItemChange }: {
    allowReadingItemChange?: boolean,
  }) => {
    // let offset = typeof offsetOrCfi === `number` ? offsetOrCfi : 0
    const latestReadingItem = readingItemManager.get(readingItemManager.getLength() - 1)
    const distanceOfLastReadingItem = readingItemManager.getPositionOf(latestReadingItem || 0)
    const maximumOffset = distanceOfLastReadingItem.end - context.getPageSize().width
    const currentReadingItem = readingItemManager.getFocusedReadingItem()
    let potentialNewReadingItem = readingItemManager.getReadingItemAtOffset(newOffset) || readingItemManager.get(0)

    // prevent to go outside of edges
    if (newOffset < 0 || (newOffset > maximumOffset)) {
      Report.log(NAMESPACE, `navigateToOffsetOrCfi`, `prevent due to out of bound offset`)
      return
    }

    const readingItem = potentialNewReadingItem !== currentReadingItem ? potentialNewReadingItem : currentReadingItem
    const readingItemHasChanged = readingItem !== currentReadingItem

    if (!readingItem) {
      Report.log(NAMESPACE, `navigateToOffsetOrCfi`, `prevent due to no reading item found`)
      return
    }
    const newReadingItemIsBeforeCurrent = !readingItemManager.isAfter(readingItem, currentReadingItem || readingItem)

    const newReadingItemPosition = readingItemHasChanged
      ? newReadingItemIsBeforeCurrent ? 'before' as const : 'after' as const
      : undefined

    if (readingItemHasChanged && allowReadingItemChange === false) {
      Report.log(NAMESPACE, `navigateToOffsetOrCfi`, `prevent due to changing reading item but it is not allowed`)
      return
    }

    return { offset: newOffset, readingItem, readingItemHasChanged, newReadingItemPosition }
  }

  const turnLeft = Report.measurePerformance(`${NAMESPACE} turnLeft`, 10, ({ allowReadingItemChange = true }: { allowReadingItemChange?: boolean } = {}) => {
    const currentXoffset = getCurrentOffset()
    const nextPosition = context.isRTL()
      ? currentXoffset + context.getPageSize().width
      : currentXoffset - context.getPageSize().width

    const resolvedNavigation = resolveReadingNavigationFromReadingOffset(nextPosition, { allowReadingItemChange })

    if (resolvedNavigation) {
      if (resolvedNavigation.readingItemHasChanged) {
        lastUserExpectedNavigation = {
          type: resolvedNavigation.newReadingItemPosition === 'after' ? 'navigate-from-previous-item' : 'navigate-from-next-item'
        }
      } else {
        lastUserExpectedNavigation = undefined
      }
      navigateTo(resolvedNavigation.offset, resolvedNavigation.readingItem)
    }
  })

  const turnRight = Report.measurePerformance(`${NAMESPACE} turnRight`, 10, ({ allowReadingItemChange = true }: { allowReadingItemChange?: boolean } = {}) => {
    const currentXoffset = getCurrentOffset()
    const nextPosition = context.isRTL()
      ? currentXoffset - context.getPageSize().width
      : currentXoffset + context.getPageSize().width

    const resolvedNavigation = resolveReadingNavigationFromReadingOffset(nextPosition, { allowReadingItemChange })

    if (resolvedNavigation) {
      if (resolvedNavigation.readingItemHasChanged) {
        lastUserExpectedNavigation = {
          type: resolvedNavigation.newReadingItemPosition === 'after' ? 'navigate-from-previous-item' : 'navigate-from-next-item'
        }
      } else {
        lastUserExpectedNavigation = undefined
      }
      navigateTo(resolvedNavigation.offset, resolvedNavigation.readingItem)
    }
  })

  const goToPageOfCurrentChapter = (pageIndex: number) => {
    const readingItem = readingItemManager.getFocusedReadingItem()

    if (readingItem) {
      const readingItemOffset = readingItemLocator.getReadingItemOffsetFromPageIndex(pageIndex, readingItem)
      const readingOffset = locator.getReadingOrderViewOffsetFromReadingItemOffset(readingItemOffset, readingItem)
      lastUserExpectedNavigation = undefined
      navigateTo(readingOffset, readingItem)
    }
  }

  const goToCfi = (cfi: string) => {
    const firstReadingItem = readingItemManager.get(0)
    const { readingItemOffset, readingItem } = resolveReadingItemOffsetAndReadingItemFromCfi(cfi)

    if (readingItem && readingItemOffset !== undefined) {
      const readingOffset = locator.getReadingOrderViewOffsetFromReadingItemOffset(readingItemOffset, readingItem)
      lastUserExpectedNavigation = { type: 'navigate-from-cfi', data: cfi }
      navigateTo(readingOffset, readingItem)
    } else if (firstReadingItem) {
      navigateTo(0, firstReadingItem)
    }
  }

  const goToSpineItem = (indexOrId: number | string) => {
    const readingItem = readingItemManager.get(indexOrId)
    const offsetOfReadingItem = readingItem ? readingItemManager.getPositionOf(readingItem).start : 0
    if (readingItem) {
      const readingOffset = locator.getReadingOrderViewOffsetFromReadingItemOffset(offsetOfReadingItem, readingItem)
      // always want to be at the beginning of the item
      lastUserExpectedNavigation = { type: 'navigate-from-previous-item' }
      navigateTo(readingOffset, readingItem)
    }
  }

  const goTo = (spineIndexOrSpineItemIdOrCfi: number | string) => {
    if (typeof spineIndexOrSpineItemIdOrCfi === `string` && spineIndexOrSpineItemIdOrCfi.startsWith(`epubcfi`)) {
      goToCfi(spineIndexOrSpineItemIdOrCfi)
    } else {
      goToSpineItem(spineIndexOrSpineItemIdOrCfi)
    }
  }

  const goToUrl = (url: string | URL) => {
    let offsetOfReadingItem: number | undefined = undefined
    // url
    let validUrl: URL | undefined
    try {
      validUrl = url instanceof URL ? url : new URL(url)
    } catch (e) {
      Report.error(e)
    }
    if (validUrl) {
      const urlWithoutAnchor = `${validUrl.origin}${validUrl.pathname}`
      const existingSpineItem = context.manifest.readingOrder.find(item => item.href === urlWithoutAnchor)
      if (existingSpineItem) {
        const readingItem = readingItemManager.get(existingSpineItem.id)
        if (readingItem) {
          offsetOfReadingItem = readingItemManager.getPositionOf(readingItem).start
          const readingOffset = locator.getReadingOrderViewOffsetFromReadingItemOffset(offsetOfReadingItem || 0, readingItem)
          lastUserExpectedNavigation = { type: 'navigate-from-anchor', data: validUrl.hash }
          navigateTo(readingOffset, readingItem)
        }
      }
    }
  }

  const resolveReadingItemOffsetAndReadingItemFromCfi = (cfi: string) => {
    let readingItemOffset = undefined
    let readingItem: ReadingItem | undefined = undefined
    const { itemId } = extractObokuMetadataFromCfi(cfi)
    if (!itemId) {
      Report.warn(`ReadingOrderView`, `unable to extract item id from cfi ${cfi}`)
    } else {
      const { itemId } = extractObokuMetadataFromCfi(cfi)
      readingItem = (itemId ? readingItemManager.get(itemId) : undefined) || readingItemManager.get(0)
      if (readingItem) {
        readingItemOffset = readingItemLocator.getReadingItemOffsetFromCfi(cfi, readingItem)
      } else {
        Report.warn(`ReadingOrderView`, `unable to detect item id from cfi ${cfi}`)
      }
    }

    return { readingItemOffset, readingItem }
  }

  /**
   * @todo optimize this function to not being called several times
   */
  const navigateTo = (offset: number, readingItem: ReadingItem) => {
    const currentReadingItem = readingItemManager.getFocusedReadingItem()
    const readingItemHasChanged = readingItem !== currentReadingItem

    adjustReadingOffset(offset)

    const offsetInCurrentReadingItem = locator.getReadingItemOffsetFromReadingOrderViewOffset(offset, readingItem)

    if (readingItemHasChanged) {
      readingItemManager.focus(readingItem)
    }

    pagination.update(readingItem, offsetInCurrentReadingItem, {
      isAtEndOfChapter: false,
      shouldUpdateCfi: lastUserExpectedNavigation?.type !== 'navigate-from-cfi'
    })

    Report.log(NAMESPACE, `navigateTo`, `navigate success`, { readingItemHasChanged, readingItem, offset, offsetInCurrentReadingItem, lastUserExpectedNavigation })

    readingItemManager.loadContents()
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

    /**
     * When `navigate-from-cfi` we always try to retrieve offset from cfi node and navigate
     * to there
     */
    if (lastUserExpectedNavigation?.type === 'navigate-from-cfi') {
      offsetInReadingItem = readingItemLocator.getReadingItemOffsetFromCfi(lastUserExpectedNavigation.data, readingItem)
      Report.log(NAMESPACE, `adjustReadingOffsetPosition`, `navigate-from-cfi`, { cfi: lastUserExpectedNavigation.data })
    } else if (lastUserExpectedNavigation?.type === 'navigate-from-next-item') {
      /**
       * When `navigate-from-next-item` we always try to get the offset of the last page, that way
       * we ensure reader is always redirected to last page
       */
      const numberOfPages = getNumberOfPages(readingItem.getBoundingClientRect().width, pageWidth)
      offsetInReadingItem = readingItemLocator.getReadingItemOffsetFromPageIndex(numberOfPages - 1, readingItem)
      Report.log(NAMESPACE, `adjustReadingOffsetPosition`, `navigate-from-next-item`, {})
    } else if (lastUserExpectedNavigation?.type === 'navigate-from-previous-item') {
      /**
       * When `navigate-from-previous-item'` 
       * we always try stay on the first page of the item
       */
      offsetInReadingItem = readingItemLocator.getReadingItemOffsetFromPageIndex(0, readingItem)
      Report.log(NAMESPACE, `adjustReadingOffsetPosition`, `navigate-from-previous-item`, {})
    } else if (lastUserExpectedNavigation?.type === 'navigate-from-anchor') {
      /**
       * When `navigate-from-anchor` we just stay on the current reading item and try to get
       * the offset of that anchor.
       */
      const anchor = lastUserExpectedNavigation.data
      offsetInReadingItem = readingItemLocator.getReadingItemOffsetFromAnchor(anchor, readingItem)
    } else if (lastCfi) {
      /**
       * When there is no last navigation then we first look for any existing CFI. If there is a cfi we try to retrieve
       * the offset and navigate the user to it
       */
      offsetInReadingItem = readingItemLocator.getReadingItemOffsetFromCfi(lastCfi, readingItem)
      Report.log(NAMESPACE, `adjustReadingOffsetPosition`, `use last cfi`)
    } else {
      /**
       * Last resort case, there is no CFI so we check the current page and try to navigate to the closest one
       */
      // @todo get x of first visible element and try to get the page for this element
      // using the last page is not accurate since we could have less pages
      const currentPageIndex = pagination.getPageIndex() || 0
      offsetInReadingItem = readingItemLocator.getReadingItemOffsetFromPageIndex(currentPageIndex, readingItem)
      Report.log(NAMESPACE, `adjustReadingOffsetPosition`, `use guess strategy`, {})
    }

    expectedReadingOrderViewOffset = locator.getReadingOrderViewOffsetFromReadingItemOffset(offsetInReadingItem, readingItem)

    Report.log(NAMESPACE, `adjustReadingOffsetPosition`, { offsetInReadingItem, expectedReadingOrderViewOffset })

    if (expectedReadingOrderViewOffset !== currentXoffset) {
      adjustReadingOffset(expectedReadingOrderViewOffset)
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
    adjustOffset: adjustReadingOffset,
    getCurrentOffset,
    turnLeft,
    turnRight,
    goTo,
    goToSpineItem,
    goToUrl,
    goToCfi,
    goToPageOfCurrentChapter,
    adjustReadingOffsetPosition,
  }
}