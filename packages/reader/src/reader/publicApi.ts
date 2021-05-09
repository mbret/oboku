import { Report } from "../report";
import { normalizeEventPositions } from "./frames";
import { getPercentageEstimate } from "./navigation";
import { createReader } from "./reader";

export const createPublicApi = (reader: ReturnType<typeof createReader>) => {
  const goToNextSpineItem = () => {
    const currentSpineIndex = reader.getReadingOrderView()?.readingItemManager.getFocusedReadingItemIndex() || 0
    const numberOfSpineItems = reader.getContext()?.manifest.readingOrder.length || 1
    if (currentSpineIndex < (numberOfSpineItems - 1)) {
      reader.getReadingOrderView()?.goTo(currentSpineIndex + 1)
    }
  }

  const goToPreviousSpineItem = () => {
    const currentSpineIndex = reader.getReadingOrderView()?.readingItemManager.getFocusedReadingItemIndex() || 0
    if (currentSpineIndex > 0) {
      reader.getReadingOrderView()?.goTo(currentSpineIndex - 1)
    }
  }

  return {
    layout: reader.layout,
    load: reader.load,
    destroy: reader.destroy,
    $: reader.$,
    turnLeft: () => {
      return reader.getReadingOrderView()?.turnLeft()
    },
    turnRight: () => {
      return reader.getReadingOrderView()?.turnRight()
    },
    goTo: (spineIndexOrIdOrCfi: number | string) => {
      reader.getReadingOrderView()?.goTo(spineIndexOrIdOrCfi)
    },
    goToPath: (path: string) => {
      const manifest = reader.getContext()?.manifest
      const foundItem = manifest?.readingOrder.find(item => item.path === path)
      if (foundItem) {
        reader.getReadingOrderView()?.goTo(foundItem.id)
      }
    },
    goToHref: (href: string) => {
      reader.getReadingOrderView()?.goToUrl(href)
    },
    goToPageOfCurrentChapter: (pageIndex: number) => {
      return reader.getReadingOrderView()?.goToPageOfCurrentChapter(pageIndex)
    },
    goToNextSpineItem,
    goToPreviousSpineItem,
    goToLeftSpineItem: () => {
      if (reader.getContext()?.isRTL()) {
        return goToNextSpineItem()
      }

      return goToPreviousSpineItem()
    },
    goToRightSpineItem: () => {
      if (reader.getContext()?.isRTL()) {
        return goToPreviousSpineItem()
      }

      return goToNextSpineItem()
    },
    getPagination() {
      const pagination = reader.getPagination()
      const readingOrderView = reader.getReadingOrderView()
      const context = reader.getContext()
      const readingItemManager = reader.getReadingOrderView()?.readingItemManager

      if (!readingOrderView || !pagination || !context) return undefined

      return {
        begin: {
          // chapterIndex: number;
          chapterInfo: readingOrderView.getChapterInfo(),
          pageIndexInChapter: pagination.getPageIndex(),
          numberOfPagesInChapter: pagination.getNumberOfPages(),
          // pages: number;
          // pageIndexInBook: number;
          // pageIndexInChapter: number;
          // pagesOfChapter: number;
          // pagePercentageInChapter: number;
          // offsetPercentageInChapter: number;
          // domIndex: number;
          // charOffset: number;
          // serializeString?: string;
          spineItemIndex: readingItemManager?.getFocusedReadingItemIndex(),
          spineItemPath: readingItemManager?.getFocusedReadingItem()?.item.path,
          spineItemId: readingItemManager?.getFocusedReadingItem()?.item.id,
          cfi: pagination.getCfi(),
        },
        // end: ReadingLocation;
        spineItemReadingDirection: readingItemManager?.getFocusedReadingItem()?.getReadingDirection(),
        /**
         * This percentage is based of the weight (kb) of every items and the number of pages.
         * It is not accurate but gives a general good idea of the overall progress.
         * It is recommended to use this progress only for reflow books. For pre-paginated books
         * the number of pages and current index can be used instead since 1 page = 1 chapter. 
         */
        percentageEstimateOfBook: getPercentageEstimate(context, readingOrderView, pagination),
        pagesOfBook: Infinity,
        // chaptersOfBook: number;
        // chapter: string;
        // hasNextChapter: (reader.getReadingOrderView().spineItemIndex || 0) < (manifest.readingOrder.length - 1),
        // hasPreviousChapter: (reader.getReadingOrderView().spineItemIndex || 0) < (manifest.readingOrder.length - 1),
        numberOfSpineItems: context.manifest.readingOrder.length
      }
    },
    getEventInformation: Report.measurePerformance(`getEventInformation`, 10, (e: PointerEvent | MouseEvent | TouchEvent) => {
      const { iframeEventBridgeElement, iframeEventBridgeElementLastContext } = reader.getIframeEventBridge()
      const readingItemManager = reader.getReadingOrderView()?.readingItemManager
      const pagination = reader.getPagination()
      const context = reader.getContext()
      const normalizedEventPointerPositions = {
        ...`clientX` in e && {
          clientX: e.clientX,
        },
        ...`x` in e && {
          x: e.x
        }
      }
      if (e.target !== iframeEventBridgeElement) {
        return { event: e, normalizedEventPointerPositions }
      }

      if (!context || !pagination) return { event: e, normalizedEventPointerPositions }

      return {
        event: e,
        iframeOriginalEvent: iframeEventBridgeElementLastContext?.event,
        normalizedEventPointerPositions: normalizeEventPositions(context, pagination, e, readingItemManager?.getFocusedReadingItem())
      }
    }),
    isSelecting: () => reader.getReadingOrderView()?.isSelecting(),
    getSelection: () => reader.getReadingOrderView()?.getSelection(),
    getManifest: () => reader.getContext()?.manifest,
  }
}