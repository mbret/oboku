import { Context } from "../context"
import { Manifest } from "../types"
import { createPrePaginatedReadingItem } from "./prePaginatedReadingItem"
import { createReflowableReadingItem } from "./reflowableReadingItem"

export type ReadingItem = ReturnType<typeof createReadingItem>

export const createReadingItem = ({ item, context, containerElement, fetchResource }: { 
  item: Manifest['readingOrder'][number], 
  containerElement: HTMLElement, 
  context: Context,
  fetchResource: `http` | ((item: Manifest['readingOrder'][number]) =>Promise<string>)
 }) => {
  let readingItem: ReturnType<typeof createPrePaginatedReadingItem> | ReturnType<typeof createReflowableReadingItem> 

  if (item.renditionLayout === 'pre-paginated') {
    readingItem = createPrePaginatedReadingItem({ item, context, containerElement, fetchResource })
  } else {
    readingItem = createReflowableReadingItem({ item, context, containerElement, fetchResource })
  }

  return {
    item,
    ...readingItem,
  }
}