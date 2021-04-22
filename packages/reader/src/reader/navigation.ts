import { Context } from "./context";
import { Pagination } from "./pagination";
import { ReadingItem } from "./readingItem";
import { ReadingOrderView } from "./readingOrderView";
import { Manifest } from "./types";

export type ChapterInfo = {
  title: string
  subChapter?: ChapterInfo
}

export const buildChapterInfoFromReadingItem = (manifest: Manifest, readingItem: ReadingItem) => {
  const { path } = readingItem.item

  return getChapterInfo(path, manifest.nav.toc)
}

const getChapterInfo = (path: string, tocItems: Manifest['nav']['toc']): ChapterInfo | undefined => {

  return tocItems.reduce((acc: ChapterInfo | undefined, item) => {
    if (path.endsWith(item.path)) {
      return {
        title: item.title
      }
    }

    const subInfo = getChapterInfo(path, item.contents)

    if (subInfo) {
      return {
        subChapter: subInfo,
        title: item.title
      }
    }

    return acc
  }, undefined)
}

export const getPercentageEstimate = (context: Context, readingOrderView: ReadingOrderView, pagination: Pagination) => {
  const currentSpineIndex = readingOrderView.getSpineItemIndex() || 0
  const currentPageIndex = pagination.getPageIndex() || 0
  const estimateToThisItem = context.manifest.readingOrder
    .slice(0, currentSpineIndex + 1)
    .reduce((acc, item) => acc + item.progressionWeight, 0)

  const nextItem = context.manifest.readingOrder[currentSpineIndex + 1]
  const nextItemWeight = nextItem ? nextItem.progressionWeight : 0
  const progressWeightGap = (nextItemWeight + estimateToThisItem) - estimateToThisItem

  console.log(currentPageIndex, progressWeightGap, pagination.getNumberOfPages())
  return estimateToThisItem + (currentPageIndex *  (progressWeightGap / pagination.getNumberOfPages()))
}