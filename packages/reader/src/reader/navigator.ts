import { interval, Subscription } from "rxjs"
import { debounce, filter, switchMap, takeUntil, tap } from "rxjs/operators"
import { Report } from "../report"
import { Context } from "./context"
import { translateFramePositionIntoPage } from "./frames"
import { buildChapterInfoFromReadingItem } from "./navigation"
import { Pagination } from "./pagination"
import { createReadingItem, ReadingItem } from "./readingItem"
import { createReadingItemManager, ReadingItemManager } from "./readingItemManager"
import { Manifest } from "./types"

export const createNavigator = ({ readingItemManager, context, pagination, element }: {
  readingItemManager: ReadingItemManager,
  pagination: Pagination,
  context: Context,
  element: HTMLElement
}) => {
  let lastUserExpectedNavigation: { type: 'turned-prev-chapter' } | { type: 'navigate-from-cfi', data: string } | undefined = undefined

  const adjustOffset = (offset: number) => {
    if (context.isRTL()) {
      element.style.transform = `translateX(${offset}px)`
    } else {
      element.style.transform = `translateX(-${offset}px)`
    }
  }

  const getCurrentOffset = () => Math.abs(element.getBoundingClientRect().x)

  const calculateOffsetForPageInReadingItem = (pageIndex: number, readingItem: ReadingItem) => {
    const { start, end } = readingItemManager.getPositionOf(readingItem)

    console.log(`calculateOffsetForPagination`, lastUserExpectedNavigation, pageIndex, pagination.calculateClosestOffsetFromPage(pageIndex, readingItem), { start, end })

    if (lastUserExpectedNavigation?.type === 'turned-prev-chapter') {
      return end - context.getPageSize().width
    } else {
      // @todo rtl
      const expectedOffset = start + pagination.calculateClosestOffsetFromPage(pageIndex, readingItem)

      return expectedOffset
    }
  }

  const turnLeft = ({ allowReadingItemChange = true }: { allowReadingItemChange?: boolean } = {}) => {
    const currentXoffset = getCurrentOffset()
    const nextPosition = context.isRTL()
      ? currentXoffset + context.getPageSize().width
      : currentXoffset - context.getPageSize().width
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
    console.log(`goToPageOfCurrentChapter`, pageIndex, readingItemManager.getFocusedReadingItem())
    const readingItem = readingItemManager.getFocusedReadingItem()
    if (readingItem) {
      const newOffset = calculateOffsetForPageInReadingItem(pageIndex, readingItem)
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

  const calculateClosestOffsetForCfiInReadingItem = (cfi: string, readingItem: ReadingItem) => {
    const { start } = readingItemManager.getPositionOf(readingItem)

    const cfiFoundNode = readingItem.resolveCfi(cfi)
    const aroundOffset = (cfiFoundNode?.parentElement?.getBoundingClientRect().x || 0)

    console.warn(readingItem.resolveCfi(cfi), cfiFoundNode?.parentElement, aroundOffset, pagination.getClosestValidOffsetFromOffset(aroundOffset, readingItem))

    return start + pagination.getClosestValidOffsetFromOffset(aroundOffset, readingItem)
  }

  const navigateToOffsetOrCfi = (offsetOrCfi: number | string, { allowReadingItemChange, startOfReadingItem }: {
    allowReadingItemChange?: boolean,
    startOfReadingItem?: boolean
  } = {}) => {
    let offset = typeof offsetOrCfi === `number` ? offsetOrCfi : 0

    /**
     * handle cfi case.
     * We lookup the offset of the correct reading item, then we try to lookup the node.
     * There is a high change the iframe is not ready yet. This is why the cfi will mostly 
     * be adjusted later. At least we navigate and focus the right reading item
     */
    if (typeof offsetOrCfi === `string`) {
      const [itemId] = offsetOrCfi.match(/(\[oboku\:[^\]]*\])+/ig) || []
      if (!itemId) {
        Report.warn(`ReadingOrderView`, `unable to extract item id from cfi ${offsetOrCfi}`)
      } else {
        const sanitizedId = decodeURIComponent(
          itemId
            .replace(/\[oboku:/, '')
            .replace(/\]/, '')
        )
        const readingItem = readingItemManager.get(sanitizedId)
        if (readingItem) {
          offset = calculateClosestOffsetForCfiInReadingItem(offsetOrCfi, readingItem)
        } else {
          Report.warn(`ReadingOrderView`, `unable to detect item id ${sanitizedId}`)
        }
      }
    }

    const latestReadingItem = readingItemManager.get(readingItemManager.getLength() - 1)
    const distanceOfLastReadingItem = readingItemManager.getPositionOf(latestReadingItem || 0)
    const maximumOffset = distanceOfLastReadingItem.end - context.getPageSize().width

    console.log(`movePositionTo`, offset, maximumOffset)

    if (offset < 0 || (offset > maximumOffset)) return

    console.log(`movePositionTo new translate`, offset)

    const currentReadingItem = readingItemManager.getFocusedReadingItem()
    const potentialNewReadingItem = readingItemManager.getReadingItemAtOffset(offset) || readingItemManager.get(0)
    const newReadingItem = potentialNewReadingItem !== currentReadingItem ? potentialNewReadingItem : currentReadingItem

    if (!newReadingItem || !potentialNewReadingItem) return

    const readingItemDistance = readingItemManager.getPositionOf(newReadingItem)
    const readingItemHasChanged = potentialNewReadingItem !== currentReadingItem
    const newReadingItemIsBeforeCurrent = !readingItemManager.isAfter(potentialNewReadingItem, currentReadingItem || potentialNewReadingItem)
    console.log(`movePositionTo`, { currentReadingItem, potentialNewReadingItem, isNew: potentialNewReadingItem !== currentReadingItem })

    if (readingItemHasChanged && allowReadingItemChange === false) {
      console.warn(`movePositionTo`, `action cancelled because reading item will change and allowReadingItemChange = false`)
      return
    }

    adjustOffset(offset)

    const offsetInCurrentReadingItem = offset - readingItemDistance.start

    if (currentReadingItem !== undefined && readingItemHasChanged && newReadingItemIsBeforeCurrent && !startOfReadingItem) {
      lastUserExpectedNavigation = { type: 'turned-prev-chapter' }
    } else if (typeof offsetOrCfi === `string`) {
      lastUserExpectedNavigation = { type: 'navigate-from-cfi', data: offsetOrCfi }
    } else {
      lastUserExpectedNavigation = undefined
    }

    pagination.update(newReadingItem, offsetInCurrentReadingItem)

    if (readingItemHasChanged) {
      readingItemManager.focus(potentialNewReadingItem)
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
   */
  const adjustPositionForCurrentPagination = () => {
    const readingItem = readingItemManager.getFocusedReadingItem()

    if (!readingItem) return

    const currentXoffset = getCurrentOffset()
    let expectedOffset = currentXoffset

    if (lastUserExpectedNavigation?.type === 'navigate-from-cfi') {
      expectedOffset = calculateClosestOffsetForCfiInReadingItem(lastUserExpectedNavigation.data, readingItem)
    } else {
      // @todo get x of first visible element and try to get the page for this element
      // using the last page is not accurate since we could have less pages
      expectedOffset = calculateOffsetForPageInReadingItem(pagination.getPageIndex() || 0, readingItem)
    }

    if (expectedOffset !== currentXoffset) {
      Report.log(`ReadingOrderView`, `adjustPositionForCurrentPagination`, `current offset ${currentXoffset} is desynchronized with expected offset ${expectedOffset} and will be updated`)
      adjustOffset(expectedOffset)
    }

    return expectedOffset
  }

  return {
    adjustOffset,
    getCurrentOffset,
    turnLeft,
    turnRight,
    goTo,
    goToPageOfCurrentChapter,
    adjustPositionForCurrentPagination,
  }
}