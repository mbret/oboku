import { EMPTY, interval, Subject, Subscription } from "rxjs"
import { catchError, debounce, filter, switchMap, takeUntil, tap } from "rxjs/operators"
import { Report } from "../report"
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
    fetchResource: `http` | ((item: Manifest['readingOrder'][number]) => Promise<string>)
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
  let focusedReadingItemSubscription: Subscription | undefined

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

  readingItemManagerSubscription = readingItemManager.$.pipe(
    tap((event) => {
      if (event.event === 'layout') {
        navigator.adjustReadingOffsetPosition({ shouldAdjustCfi: false })
      }
  
      if (event.event === 'focus') {
        const readingItem = event.data
        const fingerTracker$ = readingItem.fingerTracker.$
        const selectionTracker$ = readingItem.selectionTracker.$
  
        if (readingItem.getIsReady()) {
          // @todo maybe we need to adjust cfi here ? it should be fine since if it's already
          // ready then the navigation should have caught the right cfi, if not the observable
          // will catch it
        }
  
        focusedReadingItemSubscription?.unsubscribe()
        focusedReadingItemSubscription = readingItem.$.pipe(
          tap(event => {
            if (event.event === 'layout' && event.data.isFirstLayout && event.data.isReady) {
              navigator.adjustReadingOffsetPosition({ shouldAdjustCfi: true })
            }
          }),
          catchError(e => {
            Report.error(e)
  
            return EMPTY
          }),
        ).subscribe()
  
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
    }),
    catchError(e => {
      Report.error(e)

      return EMPTY
    }),
  ).subscribe()

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
      focusedReadingItemSubscription?.unsubscribe()
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