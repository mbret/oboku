import { interval, Subject, Subscription } from "rxjs"
import { debounce, filter, switchMap, takeUntil, tap } from "rxjs/operators"
import { Context } from "./context"
import { translateFramePositionIntoPage } from "./frames"
import { buildChapterInfoFromReadingItem } from "./navigation"
import { createNavigator } from "./navigator"
import { Pagination } from "./pagination"
import { createReadingItem } from "./readingItem"
import { createReadingItemManager } from "./readingItemManager"
import { Manifest } from "./types"

export type ReadingOrderView = ReturnType<typeof createReadingOrderView>

export const createReadingOrderView = ({ manifest, containerElement, context, pagination, options }: {
  manifest: Manifest,
  containerElement: HTMLElement
  context: Context,
  pagination: Pagination,
  options: {
    fetchResource: `http` | ((item: Manifest['readingOrder'][number]) =>Promise<string>)
  }
}) => {
  const subject = new Subject()
  const doc = containerElement.ownerDocument
  const readingItemManager = createReadingItemManager({ context })
  const element = createElement(doc)
  containerElement.appendChild(element)
  const navigator = createNavigator({ context, pagination, readingItemManager, element })
  let selectionSubscription: Subscription | undefined
  let readingItemManagerSubscription: Subscription | undefined

  const layout = () => {
    readingItemManager.layout()
  }

  const load = () => {
    manifest.readingOrder.map(async (resource) => {
      const readingItem = createReadingItem({
        item: resource,
        containerElement: element,
        context,
        fetchResource: options.fetchResource
      })
      readingItemManager.add(readingItem)
    })
  }

  readingItemManagerSubscription = readingItemManager.$.subscribe((event) => {
    if (event.event === 'layout') {
      const focusedItem = readingItemManager.getFocusedReadingItem()
      const newOffset = navigator.adjustPositionForCurrentPagination()
      if (focusedItem && newOffset !== undefined) {
        const readingItemOffset = navigator.getOffsetInCurrentReadingItem(newOffset, focusedItem)
        /**
         * There are two reason we need to update pagination here
         * - after a layout change, pagination needs to be aware of new item dimensions to calculate correct number of pages, ...
         * - after a layout change, offset can be desynchronized and we need to let pagination knows the new offset.
         * The new offset could have a different page number because there are less page now, etc.
         */
        focusedItem && pagination.update(focusedItem, readingItemOffset)
      }
    }

    if (event.event === 'focus') {
      const readingItem = event.data
      const fingerTracker$ = readingItem.fingerTracker.$
      const selectionTracker$ = readingItem.selectionTracker.$

      selectionSubscription?.unsubscribe()
      selectionSubscription = selectionTracker$
        .pipe(filter(({ event }) => event === 'selectstart'))
        .pipe(
          switchMap(_ => fingerTracker$
            .pipe(
              filter(({ event }) => event === 'fingermove'),
              debounce(() => interval(1000)),
              takeUntil(fingerTracker$
                .pipe(
                  filter(({ event }) => event === 'fingerout'),
                  tap(() => {

                  })
                )
              ),
              tap(({ data }) => {
                if (data) {
                  const fingerPosition = translateFramePositionIntoPage(context, pagination, data, readingItem)
                  if (fingerPosition.x >= context.getPageSize().width) {
                    navigator.turnRight({ allowReadingItemChange: false })
                  } else if (fingerPosition.x <= context.getPageSize().width) {
                    navigator.turnLeft({ allowReadingItemChange: false })
                  }
                }
              })
            )
          )
        )
        .subscribe()
    }
  })

  const getFocusedReadingItem = () => readingItemManager.getFocusedReadingItem()

  return {
    ...navigator,
    goToNextSpineItem: () => {
      const currentSpineIndex = readingItemManager.getFocusedReadingItemIndex() || 0
      const numberOfSpineItems = context?.manifest.readingOrder.length || 1
      if (currentSpineIndex < (numberOfSpineItems - 1)) {
        navigator.goTo(currentSpineIndex + 1)
      }
    },
    goToPreviousSpineItem: () => {
      const currentSpineIndex = readingItemManager.getFocusedReadingItemIndex() || 0
      if (currentSpineIndex > 0) {
        navigator.goTo(currentSpineIndex - 1)
      }
    },
    load,
    layout,
    getFocusedReadingItem,
    getChapterInfo() {
      const item = readingItemManager.getFocusedReadingItem()
      return item && buildChapterInfoFromReadingItem(manifest, item)
    },
    getSpineItemIndex() {
      return readingItemManager.getFocusedReadingItemIndex()
    },
    destroy: () => {
      readingItemManager.destroy()
      readingItemManagerSubscription?.unsubscribe()
      selectionSubscription?.unsubscribe()
      element.remove()
    },
    isSelecting: () => readingItemManager.getFocusedReadingItem()?.selectionTracker.isSelecting(),
    getSelection: () => readingItemManager.getFocusedReadingItem()?.selectionTracker.getSelection(),
    $: subject,
  }
}

const createElement = (doc: Document) => {
  const element = doc.createElement('div')
  element.id = 'ReadingOrderView'
  element.className = 'ReadingOrderView'
  element.style.height = `100%`
  element.style.willChange = `transform`
  element.style.transformOrigin = `0 0`

  return element
}