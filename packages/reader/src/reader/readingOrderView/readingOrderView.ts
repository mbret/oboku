import { EMPTY, interval, Subject, Subscription } from "rxjs"
import { catchError, debounce, filter, switchMap, takeUntil, tap } from "rxjs/operators"
import { Report } from "../../report"
import { Context } from "../context"
import { translateFramePositionIntoPage } from "../frames"
import { buildChapterInfoFromReadingItem } from "../navigation"
import { createViewportNavigator } from "./viewportNavigator"
import { Pagination } from "../pagination"
import { createReadingItem } from "../readingItem"
import { createReadingItemManager } from "../readingItemManager"
import { createLocator } from "./locator"
import { Hook } from "../readingItem/readingItemFrame"

const NAMESPACE = 'readingOrderView'

export type ReadingOrderView = ReturnType<typeof createReadingOrderView>

export const createReadingOrderView = ({ containerElement, context, pagination }: {
  containerElement: HTMLElement
  context: Context,
  pagination: Pagination,
}) => {
  const subject = new Subject()
  const doc = containerElement.ownerDocument
  const readingItemManager = createReadingItemManager({ context })
  const element = createElement(doc)
  containerElement.appendChild(element)
  const viewportNavigator = createViewportNavigator({ context, pagination, readingItemManager, element })
  const locator = createLocator({ context, readingItemManager })
  let selectionSubscription: Subscription | undefined
  let readingItemManagerSubscription: Subscription | undefined
  let focusedReadingItemSubscription: Subscription | undefined
  let readingItemHooks: Hook[] = []

  const layout = () => {
    readingItemManager.layout()
  }

  const load = () => {
    context.getManifest()?.readingOrder.map(async (resource) => {
      const readingItem = createReadingItem({
        item: resource,
        containerElement: element,
        context,
      })
      readingItemHooks.forEach(hook => readingItem.registerHook(hook.name, hook.fn))
      readingItemManager.add(readingItem)
    })
  }

  readingItemManagerSubscription = readingItemManager.$.pipe(
    tap((event) => {
      if (event.event === 'layout') {
        const focusedReadingItem = readingItemManager.getFocusedReadingItem()
        if (focusedReadingItem) {
          viewportNavigator.adjustReadingOffsetPosition(focusedReadingItem, { shouldAdjustCfi: false })
        }
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
              viewportNavigator.adjustReadingOffsetPosition(readingItem, { shouldAdjustCfi: true })
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
                      viewportNavigator.turnRight({ allowReadingItemChange: false })
                    } else if (fingerPosition.x <= context.getPageSize().width) {
                      viewportNavigator.turnLeft({ allowReadingItemChange: false })
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

  const navigatorSubscription = viewportNavigator.$
    .pipe(tap((data) => {
      if (data.event === 'navigation') {

        const currentReadingItem = readingItemManager.getFocusedReadingItem()
        const readingItemForCurrentNavigation = data.data.readingItem || locator.getReadingItemFromOffset(data.data.x)

        if (readingItemForCurrentNavigation) {
          const readingItemHasChanged = readingItemForCurrentNavigation !== currentReadingItem
          const readingItemPosition = locator.getReadingItemPositionFromReadingOrderViewPosition(data.data, readingItemForCurrentNavigation)

          if (readingItemHasChanged) {
            readingItemManager.focus(readingItemForCurrentNavigation)
          }

          const lastExpectedNavigation = viewportNavigator.getLastUserExpectedNavigation()

          pagination.update(readingItemForCurrentNavigation, readingItemPosition, {
            isAtEndOfChapter: false,
            cfi: lastExpectedNavigation?.type === 'navigate-from-cfi'
              ? lastExpectedNavigation.data
              : undefined
          })

          Report.log(NAMESPACE, `navigateTo`, `navigate success`, { readingItemHasChanged, readingItemForCurrentNavigation, offset: data, readingItemPosition, lastExpectedNavigation })

          readingItemManager.loadContents()
        }
      }

      if (data.event === 'adjust') {
        const currentReadingItem = readingItemManager.getFocusedReadingItem()
        const lastCfi = pagination.getCfi()
        // because we adjusted the position, the offset may have changed and with it current page, etc
        // because this is an adjustment we do not want to update the cfi (anchor)
        // unless it has not been set yet or it is a basic /0 node
        const shouldUpdateCfi = lastCfi === undefined
          ? true
          : lastCfi?.startsWith(`epubcfi(/0`)
        if (currentReadingItem) {
          const readingItemPosition = locator.getReadingItemPositionFromReadingOrderViewPosition(data.data, currentReadingItem)
          pagination.update(currentReadingItem, readingItemPosition, {
            shouldUpdateCfi,
            cfi: shouldUpdateCfi ? undefined : lastCfi,
            isAtEndOfChapter: false
          })
        }
      }
    }))
    .subscribe()

  const registerReadingItemHook: ReturnType<typeof createReadingItem>['registerHook'] = (name, hookFn) => {
    readingItemHooks.push({ name, fn: hookFn })
    readingItemManager.getAll().forEach(item => item.registerHook(name, hookFn))
  }

  return {
    ...viewportNavigator,
    readingItemManager,
    registerReadingItemHook,
    goToNextSpineItem: () => {
      const currentSpineIndex = readingItemManager.getFocusedReadingItemIndex() || 0
      const numberOfSpineItems = context?.getManifest()?.readingOrder.length || 1
      if (currentSpineIndex < (numberOfSpineItems - 1)) {
        viewportNavigator.goToSpineItem(currentSpineIndex + 1)
      }
    },
    goToPreviousSpineItem: () => {
      const currentSpineIndex = readingItemManager.getFocusedReadingItemIndex() || 0
      if (currentSpineIndex > 0) {
        viewportNavigator.goToSpineItem(currentSpineIndex - 1)
      }
    },
    load,
    layout,
    getChapterInfo() {
      const item = readingItemManager.getFocusedReadingItem()
      const manifest = context.getManifest()
      return item && manifest && buildChapterInfoFromReadingItem(manifest, item)
    },
    destroy: () => {
      readingItemManager.destroy()
      readingItemManagerSubscription?.unsubscribe()
      selectionSubscription?.unsubscribe()
      focusedReadingItemSubscription?.unsubscribe()
      navigatorSubscription.unsubscribe()
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