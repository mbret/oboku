import { Subject, Subscription } from "rxjs"
import { Report } from "../report"
import { Context } from "./context"
import { createReadingItem, ReadingItem } from "./readingItem"

export type ReadingItemManager = ReturnType<typeof createReadingItemManager>

const NAMESPACE = `readingItemManager`

export const createReadingItemManager = ({ context }: { context: Context }) => {
  const subject = new Subject<{ event: 'focus', data: ReadingItem } | { event: 'layout' }>()
  let orderedReadingItems: ReturnType<typeof createReadingItem>[] = []
  let activeReadingItemIndex: number | undefined = undefined
  let readingItemSubscriptions: Subscription[] = []

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

    const newActiveReadingItemIndex = orderedReadingItems.indexOf(readingItemToFocus)
    activeReadingItemIndex = newActiveReadingItemIndex

    Report.log(NAMESPACE, `focus item ${activeReadingItemIndex}`, readingItemToFocus)
    subject.next({ event: 'focus', data: readingItemToFocus })
  }

  const loadContents = () => {
    const numberOfAdjacentSpineItemToPreLoad = context.getLoadOptions().numberOfAdjacentSpineItemToPreLoad || 0
    orderedReadingItems.forEach((orderedReadingItem, index) => {
      if (activeReadingItemIndex !== undefined) {
        if (index < (activeReadingItemIndex - numberOfAdjacentSpineItemToPreLoad) || index > (activeReadingItemIndex + numberOfAdjacentSpineItemToPreLoad)) {
          orderedReadingItem.unloadContent()
        } else {
          if (!orderedReadingItem.getIsReady()) {
            orderedReadingItem.loadContent()
          }
        }
      }
    })
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

  const isAfter = (item1: ReadingItem, item2: ReadingItem) => {
    return orderedReadingItems.indexOf(item1) > orderedReadingItems.indexOf(item2)
  }

  const comparePositionOf = (toCompare: ReadingItem, withItem: ReadingItem) => {
    if (isAfter(toCompare, withItem)) {
      return 'after'
    }

    return 'before'
  }

  return {
    add: (readingItem: ReadingItem) => {
      orderedReadingItems.push(readingItem)

      const readingItemSubscription = readingItem.$.subscribe((event) => {
        if (event.event === 'layout') {
          // @todo at this point the inner item has an upstream layout so we only need to adjust
          // left/right position of it. We don't need to layout, maybe a `adjustPositionOfItems()` is enough
          adjustPositionOfItems()
        }
      })

      readingItemSubscriptions.push(readingItemSubscription)

      readingItem.load()
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
    loadContents,
    isAfter,
    comparePositionOf,
    getPositionOf,
    getReadingItemAtOffset: (offset: number) => {
      const detectedItem = orderedReadingItems.find(item => {
        const { start, end } = getPositionOf(item)
        return offset >= start && offset < end
      })

      if (offset === 0 && !detectedItem) return orderedReadingItems[0]

      if (!detectedItem) {
        return getFocusedReadingItem()
      }

      return detectedItem || getFocusedReadingItem()
    },
    getFocusedReadingItem,
    getFocusedReadingItemIndex: () => {
      const item = getFocusedReadingItem()
      return item && orderedReadingItems.indexOf(item)
    },
    getReadingItemIndex: (readingItem: ReadingItem) => {
      return orderedReadingItems.indexOf(readingItem)
    },
    destroy: () => {
      orderedReadingItems.forEach(item => item.destroy())
      readingItemSubscriptions.forEach(subscription => subscription.unsubscribe())
      readingItemSubscriptions = []
    },
    $: subject.asObservable()
  }
}

