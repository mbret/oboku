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
  return tocItems.reduce((acc: ChapterInfo | undefined, tocItem) => {
    const indexOfHash = tocItem.path.indexOf('#')
    const tocItemPathWithoutAnchor = indexOfHash > 0 ? tocItem.path.substr(0, indexOfHash) : tocItem.path
    if (path.endsWith(tocItemPathWithoutAnchor)) {
      return {
        title: tocItem.title
      }
    }

    const subInfo = getChapterInfo(path, tocItem.contents)

    if (subInfo) {
      return {
        subChapter: subInfo,
        title: tocItem.title
      }
    }

    return acc
  }, undefined)
}

export const getPercentageEstimate = (context: Context, readingOrderView: ReadingOrderView, pagination: Pagination) => {
  const currentSpineIndex = readingOrderView.getSpineItemIndex() || 0
  const numberOfPages = pagination.getNumberOfPages()
  const currentPageIndex = pagination.getPageIndex() || 0
  const estimateBeforeThisItem = context.manifest.readingOrder
    .slice(0, currentSpineIndex)
    .reduce((acc, item) => acc + item.progressionWeight, 0)
  const currentItemWeight = context.manifest.readingOrder[currentSpineIndex]?.progressionWeight || 0
  // const nextItem = context.manifest.readingOrder[currentSpineIndex + 1]
  // const nextItemWeight = nextItem ? nextItem.progressionWeight : 1
  // const progressWeightGap = (currentItemWeight + estimateBeforeThisItem) - estimateBeforeThisItem

  const progressWithinThisItem = (currentPageIndex + 1) * (currentItemWeight / numberOfPages)
  // console.log({currentPageIndex, progressWeightGap, nextItemWeight, estimateToThisItem: estimateBeforeThisItem}, pagination.getNumberOfPages())
  const totalProgress = estimateBeforeThisItem + progressWithinThisItem

  // because the rounding of weight use a lot of decimals we will end up with
  // something like 0.999878 for the last page
  if ((currentSpineIndex === context.manifest.readingOrder.length - 1) && (currentPageIndex === numberOfPages - 1)) {
    return 1
  }

  return totalProgress
}