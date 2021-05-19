import { Enhancer } from "../createReader";
import { ChapterInfo, getPercentageEstimate } from "../navigation";

export const paginationEnhancer: Enhancer<{
  getPaginationInfo: () => undefined | {
    begin: {
      chapterInfo: undefined | {
        title: string
        subChapter?: ChapterInfo,
        path: string
      },
      pageIndexInChapter: number | undefined,
      numberOfPagesInChapter: number | undefined,
      spineItemIndex: number | undefined,
      cfi: string | undefined,
    },
    spineItemReadingDirection: string | undefined,
    percentageEstimateOfBook: number | undefined,
    pagesOfBook: number | undefined,
    numberOfSpineItems: number | undefined
  }
}> = (next) => (options) => {
  const reader = next(options)

  return {
    ...reader,
    getPaginationInfo: () => {
      const pagination = reader.pagination
      const context = reader.context
      const focusedReadingItem = reader.getFocusedReadingItem()
      const focusedReadingItemIndex = reader.getFocusedReadingItemIndex() || 0

      if (!pagination || !context) return undefined

      return {
        begin: {
          // chapterIndex: number;
          chapterInfo: reader.getChapterInfo(),
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
          spineItemIndex: focusedReadingItemIndex,
          spineItemPath: focusedReadingItem?.item.path,
          spineItemId: focusedReadingItem?.item.id,
          cfi: pagination.getCfi(),
        },
        // end: ReadingLocation;
        spineItemReadingDirection: focusedReadingItem?.getReadingDirection(),
        /**
         * This percentage is based of the weight (kb) of every items and the number of pages.
         * It is not accurate but gives a general good idea of the overall progress.
         * It is recommended to use this progress only for reflow books. For pre-paginated books
         * the number of pages and current index can be used instead since 1 page = 1 chapter. 
         */
        percentageEstimateOfBook: getPercentageEstimate(context, focusedReadingItemIndex, pagination),
        pagesOfBook: Infinity,
        // chaptersOfBook: number;
        // chapter: string;
        // hasNextChapter: (reader.readingOrderView.spineItemIndex || 0) < (manifest.readingOrder.length - 1),
        // hasPreviousChapter: (reader.readingOrderView.spineItemIndex || 0) < (manifest.readingOrder.length - 1),
        numberOfSpineItems: context.getManifest()?.readingOrder.length
      }
    }
  }
}