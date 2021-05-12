import { Context } from "./context"
import { Pagination } from "./pagination"
import { ReadingItem } from "./readingItem"

export const translateFramePositionIntoPage = (
  context: Context,
  pagination: Pagination,
  position: { x: number, y: number },
  readingItem: ReadingItem | undefined
) => {
  const { left: iframeLeft = 0, width: iframeWidth = 0 } = readingItem?.getFrameLayoutInformation() || {}
  const { computedScale = 1 } = readingItem?.getViewPortInformation() || {}
  const pageSize = context.getPageSize()
  const numberOfPages = pagination.getNumberOfPages() || 0
  const pageIndex = pagination.getPageIndex() || 0

  const scaledX = position.x * computedScale
  const offsetAdjustedX = Math.max(0, iframeLeft + scaledX)

  return {
    x: offsetAdjustedX > pageSize.width
      ? context.isRTL()
        ? offsetAdjustedX - (pageSize.width * ((numberOfPages - 1) - pageIndex))
        : offsetAdjustedX - (pageSize.width * pageIndex)
      : offsetAdjustedX,
  }
}