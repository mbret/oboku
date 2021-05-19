import { Subscription } from "rxjs";
import { Report } from "../../report";
import { Enhancer } from "../createReader";
import { translateFramePositionIntoPage } from "../frames";

export const IFRAME_EVENT_BRIDGE_ELEMENT_ID = `obokuReaderIframeEventBridgeElement`

const pointerEvents = [
  "pointercancel" as const,
  "pointerdown" as const,
  "pointerenter" as const,
  "pointerleave" as const,
  "pointermove" as const,
  "pointerout" as const,
  "pointerover" as const,
  "pointerup" as const
]
const mouseEvents = [
  'mousedown' as const,
  'mouseup' as const,
  'mouseenter' as const,
  'mouseleave' as const,
  'mousemove' as const,
  'mouseout' as const,
  'mouseover' as const,
]

export const navigationEnhancer: Enhancer<{
  turnLeft: () => void,
  turnRight: () => void,
  goTo: (spineIndexOrIdOrCfi: number | string) => void,
  goToPageOfCurrentChapter: (pageIndex: number) => void,
  getEventInformation: (e: PointerEvent | MouseEvent | TouchEvent) => {
    event: PointerEvent | MouseEvent | TouchEvent,
    iframeOriginalEvent?: Event | undefined,
    normalizedEventPointerPositions: {
      x?: number | undefined;
      clientX?: number | undefined;
    }
  }
}> = (next) => (options) => {
  const reader = next(options)

  let iframeEventBridgeElementLastContext: { event: Event, iframeTarget: Event['target'] } | undefined = undefined
  let contextSubscription: Subscription | undefined
  let readerSubscription: Subscription | undefined
  const iframeEventBridgeElement = createIframeEventBridgeElement(options.containerElement)

  // const goToNextSpineItem = () => {
  //   const currentSpineIndex = reader.readingOrderView.readingItemManager.getFocusedReadingItemIndex() || 0
  //   const numberOfSpineItems = reader.context.manifest.readingOrder.length || 1
  //   if (currentSpineIndex < (numberOfSpineItems - 1)) {
  //     reader.readingOrderView.goTo(currentSpineIndex + 1)
  //   }
  // }

  // const goToPreviousSpineItem = () => {
  //   const currentSpineIndex = reader.readingOrderView.readingItemManager.getFocusedReadingItemIndex() || 0
  //   if (currentSpineIndex > 0) {
  //     reader.readingOrderView.goTo(currentSpineIndex - 1)
  //   }
  // }

  const handleIframeClickEvent = (frame: HTMLIFrameElement, event: PointerEvent | MouseEvent) => {
    const frameWindow = frame.contentWindow

    if (!frameWindow) return

    // safe way to detect PointerEvent
    if (`pointerId` in event) {
      const iframeEvent = event as PointerEvent
      const bridgeEvent = new PointerEvent(iframeEvent.type, iframeEvent)
      iframeEventBridgeElement.dispatchEvent(bridgeEvent)
      iframeEventBridgeElementLastContext = { event: iframeEvent, iframeTarget: iframeEvent.target }
    } else if (event instanceof (frameWindow as any).MouseEvent) {
      const iframeEvent = event as MouseEvent
      const bridgeEvent = new MouseEvent(iframeEvent.type, iframeEvent)
      iframeEventBridgeElement.dispatchEvent(bridgeEvent)
      iframeEventBridgeElementLastContext = { event: bridgeEvent, iframeTarget: iframeEvent.target }
    } else {
      iframeEventBridgeElementLastContext = undefined
    }
  }

  reader.manipulateContainer(container => {
    container.appendChild(iframeEventBridgeElement)
  })

  reader.registerHook(`readingItem.onLoad`, ({ frame }) => {
    pointerEvents.forEach(event => {
      frame.contentDocument?.addEventListener(event, (e) => {
        handleIframeClickEvent(frame, e)
      })
    })
    
    mouseEvents.forEach(event => {
      frame.contentDocument?.addEventListener(event, (e) => {
        handleIframeClickEvent(frame, e)
      })
    })
  })

  return {
    ...reader,
    destroy: () => {
      reader.destroy()
      contextSubscription?.unsubscribe()
      readerSubscription?.unsubscribe()
      iframeEventBridgeElement.remove()
      iframeEventBridgeElementLastContext = undefined
    },
    turnLeft: () => reader.turnLeft(),
    turnRight: () => reader.turnRight(),
    goTo: (spineIndexOrIdOrCfi: number | string) => reader.goTo(spineIndexOrIdOrCfi),
    goToPageOfCurrentChapter: (pageIndex: number) => reader.goToPageOfCurrentChapter(pageIndex),
    // goToPath: (path: string) => {
    //   const manifest = reader.context.manifest
    //   const foundItem = manifest?.readingOrder.find(item => item.path === path)
    //   if (foundItem) {
    //     reader.readingOrderView.goTo(foundItem.id)
    //   }
    // },
    // goToHref: (href: string) => {
    //   reader.readingOrderView.goToUrl(href)
    // },
    // goToPageOfCurrentChapter: (pageIndex: number) => {
    //   return reader.readingOrderView.goToPageOfCurrentChapter(pageIndex)
    // },
    // goToNextSpineItem,
    // goToPreviousSpineItem,
    // goToLeftSpineItem: () => {
    //   if (reader.context.isRTL()) {
    //     return goToNextSpineItem()
    //   }

    //   return goToPreviousSpineItem()
    // },
    // goToRightSpineItem: () => {
    //   if (reader.context.isRTL()) {
    //     return goToPreviousSpineItem()
    //   }

    //   return goToNextSpineItem()
    // },
    getEventInformation: Report.measurePerformance(`getEventInformation`, 10, (e: PointerEvent | MouseEvent | TouchEvent) => {
      const pagination = reader.pagination
      const context = reader.context
      const normalizedEventPointerPositions = {
        ...`clientX` in e && {
          clientX: e.clientX,
        },
        ...`x` in e && {
          x: e.x
        }
      }
      if (e.target !== iframeEventBridgeElement) {
        return { event: e, normalizedEventPointerPositions }
      }

      if (!context || !pagination) return { event: e, normalizedEventPointerPositions }

      return {
        event: e,
        iframeOriginalEvent: iframeEventBridgeElementLastContext?.event,
        normalizedEventPointerPositions: {
          // ...e,
          x: 0,
          ...`clientX` in e && {
            clientX: e.clientX,
          },
          ...`x` in e && {
            x: translateFramePositionIntoPage(
              context,
              pagination,
              { x: e.x, y: e.y },
              reader.getFocusedReadingItem(),
            ).x
          }
        }
      }
    }),
  }
}

const createIframeEventBridgeElement = (containerElement: HTMLElement) => {
  const iframeEventBridgeElement = containerElement.ownerDocument.createElement('div')
  iframeEventBridgeElement.id = IFRAME_EVENT_BRIDGE_ELEMENT_ID
  iframeEventBridgeElement.style.cssText = `
    position: absolute;
    height: 100%;
    width: 100%;
  `

  return iframeEventBridgeElement
}