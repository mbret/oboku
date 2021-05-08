import { Subject, Subscription } from "rxjs";
import { tap } from "rxjs/operators";
import { Report } from "../report";
import { IFRAME_EVENT_BRIDGE_ELEMENT_ID } from "./constants";
import { Context, ContextObservableEvents, createContext as createBookContext } from "./context";
import { createPagination } from "./pagination";
import { createReadingOrderView, ReadingOrderView } from "./readingOrderView";
import { LoadOptions, Manifest } from "./types";

export const createReader = ({ containerElement }: {
  containerElement: HTMLElement
}) => {
  const subject = new Subject<{ event: 'paginationChange' } | { event: 'iframe', data: HTMLIFrameElement } | { event: 'ready' } | ContextObservableEvents>()
  let context: Context | undefined
  let pagination: ReturnType<typeof createPagination> | undefined
  const element = createWrapperElement(containerElement)
  const iframeEventBridgeElement = createIframeEventBridgeElement(containerElement)
  let iframeEventBridgeElementLastContext: { event: Event, iframeTarget: Event['target'] } | undefined = undefined
  let readingOrderView: ReadingOrderView | undefined
  let paginationSubscription$: Subscription | undefined
  element.appendChild(iframeEventBridgeElement)
  containerElement.appendChild(element)
  let context$: Subscription | undefined

  const layout = () => {
    const dimensions = {
      width: containerElement.offsetWidth,
      height: containerElement.offsetHeight,
    }
    let margin = 0
    let marginTop = 0
    let marginBottom = 0
    let isReflow = true // @todo
    const containerElementWidth = dimensions.width
    const containerElementEvenWidth =
      containerElementWidth % 2 === 0 || isReflow
        ? containerElementWidth
        : containerElementWidth - 1 // @todo careful with the -1, dunno why it's here yet

    element.style.width = `${containerElementEvenWidth - 2 * margin}px`
    element.style.height = `${dimensions.height - marginTop - marginBottom}px`
    if (margin > 0 || marginTop > 0 || marginBottom > 0) {
      element.style.margin = `${marginTop}px ${margin}px ${marginBottom}px`
    }
    const elementRect = element.getBoundingClientRect()

    context?.setVisibleAreaRect(
      elementRect.x,
      elementRect.y,
      containerElementEvenWidth,
      dimensions.height
    )

    readingOrderView?.layout()
  }

  const load = (
    manifest: Manifest,
    loadOptions: LoadOptions = {
        fetchResource: `http`
      },
    cfi?: string | null
  ) => {
    if (context) {
      Report.warn(`loading a new book is not supported yet`)
      return
    }

    Report.log(`load`, { manifest, spineIndexOrIdOrCfi: cfi })

    context = createBookContext(manifest, loadOptions)

    context$?.unsubscribe()
    context$ = context.$
      .pipe(tap(event => {
        if (event.event === 'iframeEvent') {
          const frameWindow = event.data.frame.contentWindow

          if (!frameWindow) return

          // safe way to detect PointerEvent
          if (`pointerId` in event.data.event) {
            const iframeEvent = event.data.event as PointerEvent
            const bridgeEvent = new PointerEvent(iframeEvent.type, iframeEvent)
            iframeEventBridgeElement.dispatchEvent(bridgeEvent)
            iframeEventBridgeElementLastContext = { event: iframeEvent, iframeTarget: iframeEvent.target }
          } else if (event.data.event instanceof (frameWindow as any).MouseEvent) {
            const iframeEvent = event.data.event as MouseEvent
            const bridgeEvent = new MouseEvent(iframeEvent.type, iframeEvent)
            iframeEventBridgeElement.dispatchEvent(bridgeEvent)
            iframeEventBridgeElementLastContext = { event: bridgeEvent, iframeTarget: iframeEvent.target }
          } else {
            iframeEventBridgeElementLastContext = undefined
          }
        }
      }))
      .subscribe(subject)

    pagination = createPagination({ context })
    readingOrderView = createReadingOrderView({
      manifest: manifest,
      containerElement: element,
      context,
      pagination,
    })

    readingOrderView.load()

    // @todo support navigating through specific reading item & position
    // this will trigger every layout needed from this point. This allow user to start navigating
    // through the book even before other chapter are ready
    // readingOrderView.moveTo(20)
    if (!cfi) {
      readingOrderView.goToSpineItem(0)
    } else {
      readingOrderView.goToCfi(cfi)
    }

    layout()

    paginationSubscription$?.unsubscribe()
    paginationSubscription$ = pagination.$.subscribe(({ event }) => {
      switch (event) {
        case 'change':
          return subject.next({ event: 'paginationChange' })
      }
    })

    subject.next({ event: 'ready' })
  }

  /**
   * Free up resources, and dispose the whole reader.
   * You should call this method if you leave the reader.
   * 
   * This is not possible to use any of the reader features once it
   * has been destroyed. If you need to open a new book you need to
   * either create a new reader or call `load` with a different manifest
   * instead of destroying it.
   */
  const destroy = () => {
    readingOrderView?.destroy()
    paginationSubscription$?.unsubscribe()
    context$?.unsubscribe()
    element.remove()
    iframeEventBridgeElement.remove()
    iframeEventBridgeElementLastContext = undefined
  }

  const publicApi = {
    getReadingOrderView: () => readingOrderView,
    getContext: () => context,
    getPagination: () => pagination,
    getIframeEventBridge: () => ({
      iframeEventBridgeElement,
      iframeEventBridgeElementLastContext,
    }),
    layout,
    load,
    destroy,
    $: subject.asObservable()
  }

  return publicApi
}

const createWrapperElement = (containerElement: HTMLElement) => {
  const element = containerElement.ownerDocument.createElement('div')
  element.id = 'BookView'
  element.style.setProperty(`overflow`, `hidden`)
  element.style.setProperty(`position`, `relative`)

  return element
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