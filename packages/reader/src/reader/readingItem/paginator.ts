import { ReadingItem } from ".";
import { Context } from "../context";

export const createPaginator = ({ context }: { context: Context }) => {

  const getReadingItemNumberOfPages = (readingItem: ReadingItem) => {
    const writingMode = readingItem.readingItemFrame.getWritingMode()
    const { width, height } = readingItem.getBoundingClientRect()

    if (writingMode === 'vertical-rl') {
      return getNumberOfPages(height, context.getPageSize().height)
    }

    return getNumberOfPages(width, context.getPageSize().width)
  }

  return {
    getReadingItemNumberOfPages
  }
}

const getNumberOfPages = (itemWidth: number, pageWidth: number) => {
  if ((pageWidth || 0) === 0 || (itemWidth || 0) === 0) return 1
  return Math.floor(Math.max(1, itemWidth / pageWidth))
}