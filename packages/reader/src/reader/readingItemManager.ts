import { Subject } from "rxjs"
import { Report } from "../report"
import { Context } from "./context"
import { createReadingItem, ReadingItem } from "./readingItem"

export type ReadingItemManager = ReturnType<typeof createReadingItemManager>

export const createReadingItemManager = ({ context }: { context: Context }) => {
  const subject = new Subject<{ event: 'focus', data: ReadingItem } | { event: 'layout' }>()
  let orderedReadingItems: ReturnType<typeof createReadingItem>[] = []
  let activeReadingItemIndex: number | undefined = undefined

  const layout = () => {
    orderedReadingItems.reduce((edgeOffset, item) => {
      const { width } = item.layout()
      item.adjustPositionOfElement(edgeOffset)

      return width + edgeOffset
    }, 0)

    subject.next({ event: 'layout' })
  }

  const adjustPositionOfItems = () => {
    orderedReadingItems.reduce((edgeOffset, item) => {
      const itemWidth = item.getBoundingClientRect().width
      item.adjustPositionOfElement(edgeOffset)

      return itemWidth + edgeOffset
    }, 0)

    subject.next({ event: 'layout' })
  }

  const focus = (indexOrReadingItem: number | ReadingItem) => {
    const readingItemToFocus = typeof indexOrReadingItem === `number` ? get(indexOrReadingItem) : indexOrReadingItem

    if (!readingItemToFocus) return

    const previousReadingItem = getFocusedReadingItem()
    activeReadingItemIndex = orderedReadingItems.indexOf(readingItemToFocus)

    if (readingItemToFocus !== previousReadingItem) {
      previousReadingItem?.unloadContent().catch(Report.error)
      layout()
    }

    // since layout triggers an event, things may have changed
    getFocusedReadingItem()?.loadContent().then(() => {
      layout()
    })

    subject.next({ event: 'focus', data: readingItemToFocus })
  }

  const get = (indexOrId: number | string) => {
    if (typeof indexOrId === `number`) return orderedReadingItems[indexOrId]

    return orderedReadingItems.find(({ item }) => item.id === indexOrId)
  }

  const getPositionOf = (readingItemOrIndex: ReadingItem | number) => {
    const indexOfItem = typeof readingItemOrIndex === 'number' ? readingItemOrIndex : orderedReadingItems.indexOf(readingItemOrIndex)

    const distance = orderedReadingItems.slice(0, indexOfItem + 1).reduce((acc, readingItem) => {
      return {
        start: acc.end,
        end: acc.end + (readingItem.getBoundingClientRect()?.width || 0)
      }
    }, { start: 0, end: 0 })

    if (typeof readingItemOrIndex === 'number') {
      return {
        ...get(readingItemOrIndex)?.getBoundingClientRect(),
        ...distance
      }
    }

    return {
      ...readingItemOrIndex.getBoundingClientRect(),
      ...distance
    }
  }

  const getFocusedReadingItem = () => activeReadingItemIndex !== undefined ? orderedReadingItems[activeReadingItemIndex] : undefined

  const isOffsetOutsideOfFocusedItem = (offset: number) => {
    const focusedItem = getFocusedReadingItem()

    if (!focusedItem) return true

    const { start, end } = getPositionOf(focusedItem)
    const isOutside = offset < start || offset > end
    // console.log(`isOffsetOutsideOfFocusedItem`, { start, end, offset, isOutside })
    // @todo rtl
    return isOutside
  }

  return {
    add: (readingItem: ReadingItem) => {
      orderedReadingItems.push(readingItem)

      readingItem.load()

      // @todo unsubscribe on unload
      readingItem.$.subscribe((event) => {
        if (event.event === 'layout') {
          // @todo at this point the inner item has an upstream layout so we only need to adjust
          // left/right position of it. We don't need to layout, maybe a `adjustPositionOfItems()` is enough
          adjustPositionOfItems()
        }
      })
    },
    get,
    set: (readingItems: ReturnType<typeof createReadingItem>[]) => {
      orderedReadingItems = readingItems
    },
    getLength() {
      return orderedReadingItems.length
    },
    layout,
    focus,
    isAfter: (item1: ReadingItem, item2: ReadingItem) => {
      return orderedReadingItems.indexOf(item1) > orderedReadingItems.indexOf(item2)
    },
    getPositionOf,
    isOffsetOutsideOfFocusedItem,
    getReadingItemAtOffset: (offset: number) => {
      const detectedItem = orderedReadingItems.find(item => {
        const { start, end } = getPositionOf(item)
        return offset >= start && offset < end
      })

      if (!detectedItem) {
        Report.warn(`unable to detect reading item at offset`, offset)
      }

      return detectedItem || getFocusedReadingItem()
    },
    getFocusedReadingItem,
    getFocusedReadingItemIndex: () => {
      const item = getFocusedReadingItem()
      return item && orderedReadingItems.indexOf(item)
    },
    destroy: () => {
      orderedReadingItems.forEach(item => item.destroy())
    },
    $: subject.asObservable()
  }
}

