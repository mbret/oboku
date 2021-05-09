import { Report } from "../../report"
import { extractObokuMetadataFromCfi } from "../cfi"
import { Context } from "../context"
import { ReadingItemManager } from "../readingItemManager"
import { ReadingItem } from "../readingItem"
import { createNavigator as createReadingItemNavigator } from "../readingItem/navigator"
import { createLocator } from "./locator"

type NavigationEntry = { x: number, y: number, readingItem?: ReadingItem }

const NAMESPACE = `readingOrderViewNavigator`

export const createNavigator = ({ context, readingItemManager }: {
  context: Context,
  readingItemManager: ReadingItemManager
}) => {
  const readingItemNavigator = createReadingItemNavigator({ context })
  const locator = createLocator({ context, readingItemManager })

  const arePositionsDifferent = (a: { x: number, y: number }, b: { x: number, y: number }) => a.x !== b.x || a.y !== b.y

  const isWithinNavigableRange = (position: { x: number, y: number }) => {
    const lastReadingItem = readingItemManager.get(readingItemManager.getLength() - 1)
    const distanceOfLastReadingItem = readingItemManager.getPositionOf(lastReadingItem || 0)
    const maximumOffset = distanceOfLastReadingItem.end - context.getPageSize().width

    // prevent to go outside of edges
    if (position.x < 0 || (position.x > maximumOffset)) {
      Report.log(NAMESPACE, `navigateToOffsetOrCfi`, `prevent due to out of bound offset`)
      return false
    }

    return true
  }

  const getNavigationForCfi = (cfi: string): NavigationEntry => {
    const { itemId } = extractObokuMetadataFromCfi(cfi)
    if (!itemId) {
      Report.warn(`ReadingOrderView`, `unable to extract item id from cfi ${cfi}`)
    } else {
      const { itemId } = extractObokuMetadataFromCfi(cfi)
      const readingItem = (itemId ? readingItemManager.get(itemId) : undefined) || readingItemManager.get(0)
      if (readingItem) {
        const navigation = readingItemNavigator.getNavigationForCfi(cfi, readingItem)
        const readingOffset = locator.getReadingOrderViewOffsetFromReadingItemOffset(navigation.x, readingItem)

        return { x: readingOffset, y: 0, readingItem }
      } else {
        Report.warn(`ReadingOrderView`, `unable to detect item id from cfi ${cfi}`)
      }
    }

    return { x: 0, y: 0 }
  }

  const getNavigationForPage = (pageIndex: number, readingItem: ReadingItem): NavigationEntry => {
    const readingItemNavigation = readingItemNavigator.getNavigationForPage(pageIndex, readingItem)
    const readingOffset = locator.getReadingOrderViewOffsetFromReadingItemOffset(readingItemNavigation.x, readingItem)

    return { x: readingOffset, y: 0 }
  }

  const getNavigationForLastPage = (readingItem: ReadingItem): NavigationEntry => {
    const readingItemNavigation = readingItemNavigator.getNavigationForLastPage(readingItem)
    const readingOffset = locator.getReadingOrderViewOffsetFromReadingItemOffset(readingItemNavigation.x, readingItem)

    return { x: readingOffset, y: 0 }
  }

  const getNavigationForSpineIndexOrId = (indexOrId: number | string): NavigationEntry => {
    const readingItem = readingItemManager.get(indexOrId)
    if (readingItem) {
      const readingOffset = locator.getReadingOrderViewOffsetFromReadingItem(readingItem)
      return { x: readingOffset, y: 0, readingItem }
    }

    return { x: 0, y: 0 }
  }

  const getNavigationForRightPage = (fromOffset: number): NavigationEntry => {
    const readingItem = locator.getReadingItemFromOffset(fromOffset)
    const defaultNavigation = { x: fromOffset, y: 0 }

    if (!readingItem) {
      return defaultNavigation
    }

    const readingItemPosition = locator.getReadingItemPositionFromReadingOrderViewOffset(fromOffset, readingItem)
    const readingItemNavigation = readingItemNavigator.getNavigationForRightPage(readingItemPosition.x, readingItem)
    const isNewNavigation = arePositionsDifferent(readingItemNavigation, readingItemPosition)

    if (!isNewNavigation) {
      let nextPosition = context.isRTL()
        ? fromOffset - context.getPageSize().width
        : fromOffset + context.getPageSize().width

      if (isWithinNavigableRange({ x: nextPosition, y: 0 })) {
        return { x: nextPosition, y: 0 }
      }
    } else {
      const readingOrderOffset = locator.getReadingOrderViewOffsetFromReadingItemOffset(readingItemNavigation.x, readingItem)

      return { x: readingOrderOffset, y: 0 }
    }

    return defaultNavigation
  }

  const getNavigationForLeftPage = (fromOffset: number): NavigationEntry => {
    const readingItem = locator.getReadingItemFromOffset(fromOffset)
    const defaultNavigation = { x: fromOffset, y: 0, readingItem }

    if (!readingItem) {
      return defaultNavigation
    }

    const readingItemPosition = locator.getReadingItemPositionFromReadingOrderViewOffset(fromOffset, readingItem)
    const readingItemNavigation = readingItemNavigator.getNavigationForLeftPage(readingItemPosition.x, readingItem)
    const isNewNavigation = arePositionsDifferent(readingItemNavigation, readingItemPosition)

    if (!isNewNavigation) {
      const nextPosition = context.isRTL()
        ? fromOffset + context.getPageSize().width
        : fromOffset - context.getPageSize().width

      if (isWithinNavigableRange({ x: nextPosition, y: 0 })) {
        return { x: nextPosition, y: 0 }
      }
    } else {
      const readingOrderOffset = locator.getReadingOrderViewOffsetFromReadingItemOffset(readingItemNavigation.x, readingItem)

      return { x: readingOrderOffset, y: 0, readingItem }
    }

    return defaultNavigation
  }

  const getNavigationForUrl = (url: string | URL): NavigationEntry & { url: URL } | undefined => {
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
          const position = getNavigationForAnchor(validUrl.hash, readingItem)

          return { ...position, url: validUrl }
        }
      }
    }

    return undefined
  }

  const getNavigationForAnchor = (anchor: string, readingItem: ReadingItem) => {
    return locator.getReadingOrderViewPositionFromReadingOrderAnchor(anchor, readingItem)
  }

  return {
    getNavigationForCfi,
    getNavigationForPage,
    getNavigationForLastPage,
    getNavigationForSpineIndexOrId,
    getNavigationForRightPage,
    getNavigationForLeftPage,
    getNavigationForUrl,
    getNavigationForAnchor,
  }
}