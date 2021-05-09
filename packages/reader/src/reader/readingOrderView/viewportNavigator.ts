import { Report } from "../../report"
import { Context } from "../context"
import { Pagination } from "../pagination"
import { ReadingItemManager } from "../readingItemManager"
import { createLocator } from "./locator"
import { createNavigator } from "./navigator"
import { Subject } from "rxjs"
import { ReadingItem } from "../readingItem"

const NAMESPACE = `viewportNavigator`

export const createViewportNavigator = ({ readingItemManager, context, pagination, element }: {
  readingItemManager: ReadingItemManager,
  pagination: Pagination,
  context: Context,
  element: HTMLElement
}) => {
  const navigator = createNavigator({ context, readingItemManager })
  const locator = createLocator({ context, readingItemManager })
  let isFirstNavigation = true
  const subject = new Subject<{ event: 'navigation', data: { x: number, y: number, readingItem?: ReadingItem } } | { event: 'adjust', data: { x: number, y: number } }>()
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

  const areNavigationDifferent = (a: { x: number, y: number }, b: { x: number, y: number }) => a.x !== b.x || a.y !== b.y

  const getCurrentViewport = () => ({
    x: Math.floor(Math.abs(element.getBoundingClientRect().x)),
    y: 0
  })

  const turnTo = (navigation: { x: number, y: number }, { allowReadingItemChange = true }: { allowReadingItemChange?: boolean } = {}) => {
    const currentReadingItem = readingItemManager.getFocusedReadingItem()

    if (!currentReadingItem) return

    const newReadingItem = locator.getReadingItemFromOffset(navigation.x) || currentReadingItem
    const readingItemHasChanged = newReadingItem !== currentReadingItem

    if (readingItemHasChanged) {
      if (allowReadingItemChange) {
        if (readingItemManager.comparePositionOf(newReadingItem, currentReadingItem) === 'before') {
          lastUserExpectedNavigation = { type: 'navigate-from-next-item' }
          navigateTo(navigator.getNavigationForLastPage(newReadingItem))
        } else {
          lastUserExpectedNavigation = { type: 'navigate-from-previous-item' }
          navigateTo(navigator.getNavigationForPage(0, newReadingItem))
        }
      }
    } else {
      lastUserExpectedNavigation = undefined
      navigateTo(navigation)
    }
  }

  const turnLeft = Report.measurePerformance(`${NAMESPACE} turnLeft`, 10, ({ allowReadingItemChange = true }: { allowReadingItemChange?: boolean } = {}) => {
    const currentXoffset = getCurrentViewport()
    const navigation = navigator.getNavigationForLeftPage(currentXoffset.x)

    turnTo(navigation, { allowReadingItemChange })
  })

  const turnRight = Report.measurePerformance(`${NAMESPACE} turnRight`, 10, ({ allowReadingItemChange = true }: { allowReadingItemChange?: boolean } = {}) => {
    const currentXoffset = getCurrentViewport()
    const navigation = navigator.getNavigationForRightPage(currentXoffset.x)

    turnTo(navigation, { allowReadingItemChange })
  })

  const goToPageOfCurrentChapter = (pageIndex: number) => {
    const readingItem = readingItemManager.getFocusedReadingItem()

    if (readingItem) {
      const navigation = navigator.getNavigationForPage(pageIndex, readingItem)
      lastUserExpectedNavigation = undefined
      navigateTo(navigation)
    }
  }

  const goToCfi = (cfi: string) => {
    Report.log(NAMESPACE, `goToCfi`, { cfi })
    const navigation = navigator.getNavigationForCfi(cfi)
    lastUserExpectedNavigation = { type: 'navigate-from-cfi', data: cfi }
    navigateTo(navigation)
  }

  const goToSpineItem = (indexOrId: number | string) => {
    const navigation = navigator.getNavigationForSpineIndexOrId(indexOrId)
    // always want to be at the beginning of the item
    lastUserExpectedNavigation = { type: 'navigate-from-previous-item' }
    navigateTo(navigation)
  }

  const goTo = (spineIndexOrSpineItemIdOrCfi: number | string) => {
    if (typeof spineIndexOrSpineItemIdOrCfi === `string` && spineIndexOrSpineItemIdOrCfi.startsWith(`epubcfi`)) {
      goToCfi(spineIndexOrSpineItemIdOrCfi)
    } else {
      goToSpineItem(spineIndexOrSpineItemIdOrCfi)
    }
  }

  const goToUrl = (url: string | URL) => {
    const navigation = navigator.getNavigationForUrl(url)

    if (navigation) {
      lastUserExpectedNavigation = { type: 'navigate-from-anchor', data: navigation.url.hash }
      navigateTo(navigation)
    }
  }

  /**
   * @todo optimize this function to not being called several times
   */
  const navigateTo = (navigation: { x: number, y: number, readingItem?: ReadingItem }) => {
    if (!isFirstNavigation && !areNavigationDifferent(navigation, getCurrentViewport())) {
      Report.warn(NAMESPACE, `prevent useless navigation`)
      return
    }

    isFirstNavigation = false

    adjustReadingOffset(navigation.x)

    subject.next({ event: 'navigation', data: navigation })
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
  const adjustReadingOffsetPosition = (readingItem: ReadingItem, { shouldAdjustCfi }: { shouldAdjustCfi: boolean }) => {
    const currentXoffset = getCurrentViewport()
    const lastCfi = pagination.getCfi()
    let expectedReadingOrderViewOffset = currentXoffset.x
    let offsetInReadingItem = 0

    /**
     * When `navigate-from-cfi` we always try to retrieve offset from cfi node and navigate
     * to there
     */
    if (lastUserExpectedNavigation?.type === 'navigate-from-cfi') {
      expectedReadingOrderViewOffset = navigator.getNavigationForCfi(lastUserExpectedNavigation.data).x
      Report.log(NAMESPACE, `navigate-from-cfi`, `use last cfi`)
    } else if (lastUserExpectedNavigation?.type === 'navigate-from-next-item') {
      /**
       * When `navigate-from-next-item` we always try to get the offset of the last page, that way
       * we ensure reader is always redirected to last page
       */
      expectedReadingOrderViewOffset = navigator.getNavigationForLastPage(readingItem).x
      Report.log(NAMESPACE, `adjustReadingOffsetPosition`, `navigate-from-next-item`, {})
    } else if (lastUserExpectedNavigation?.type === 'navigate-from-previous-item') {
      /**
       * When `navigate-from-previous-item'` 
       * we always try stay on the first page of the item
       */
      expectedReadingOrderViewOffset = navigator.getNavigationForPage(0, readingItem).x
      Report.log(NAMESPACE, `adjustReadingOffsetPosition`, `navigate-from-previous-item`, {})
    } else if (lastUserExpectedNavigation?.type === 'navigate-from-anchor') {
      /**
       * When `navigate-from-anchor` we just stay on the current reading item and try to get
       * the offset of that anchor.
       */
      const anchor = lastUserExpectedNavigation.data
      expectedReadingOrderViewOffset = navigator.getNavigationForAnchor(anchor, readingItem).x
    } else if (lastCfi) {
      /**
       * When there is no last navigation then we first look for any existing CFI. If there is a cfi we try to retrieve
       * the offset and navigate the user to it
       */
      expectedReadingOrderViewOffset = navigator.getNavigationForCfi(lastCfi).x
      Report.log(NAMESPACE, `adjustReadingOffsetPosition`, `use last cfi`)
    } else {
      /**
       * Last resort case, there is no CFI so we check the current page and try to navigate to the closest one
       */
      // @todo get x of first visible element and try to get the page for this element
      // using the last page is not accurate since we could have less pages
      const currentPageIndex = pagination.getPageIndex() || 0
      expectedReadingOrderViewOffset = navigator.getNavigationForPage(currentPageIndex, readingItem).x
      Report.log(NAMESPACE, `adjustReadingOffsetPosition`, `use guess strategy`, {})
    }

    Report.log(NAMESPACE, `adjustReadingOffsetPosition`, { offsetInReadingItem, expectedReadingOrderViewOffset, lastUserExpectedNavigation })

    if (areNavigationDifferent({ x: expectedReadingOrderViewOffset, y: 0 }, currentXoffset)) {
      adjustReadingOffset(expectedReadingOrderViewOffset)
    }

    subject.next({ event: 'adjust', data: { x: expectedReadingOrderViewOffset, y: 0 } })
  }

  return {
    adjustOffset: adjustReadingOffset,
    getCurrentOffset: getCurrentViewport,
    turnLeft,
    turnRight,
    goTo,
    goToSpineItem,
    goToUrl,
    goToCfi,
    goToPageOfCurrentChapter,
    adjustReadingOffsetPosition,
    getLastUserExpectedNavigation: () => lastUserExpectedNavigation,
    $: subject.asObservable(),
  }
}