import { Subject, Subscription } from "rxjs";
import { Context, createContext as createBookContext } from "./context";
import { normalizeEventPositions } from "./frames";
import { getPercentageEstimate } from "./navigation";
import { createPagination } from "./pagination";
import { createReadingOrderView, ReadingOrderView } from "./readingOrderView";
import { Manifest } from "./types";

export type Reader = ReturnType<typeof createReader>

export const createReader = ({ containerElement }: {
  containerElement: HTMLElement
}) => {
  const subject = new Subject<{ event: 'paginationChange' } | { event: 'iframe', data: HTMLIFrameElement } | { event: 'ready' }>()
  let context: Context | undefined
  let pagination: ReturnType<typeof createPagination> | undefined
  const element = createWrapperElement(containerElement)
  const iframeEventIntercept = createIframeMouseInterceptorElement(containerElement)
  let readingOrderView: ReadingOrderView | undefined
  let paginationSubscription$: Subscription | undefined
  element.appendChild(iframeEventIntercept)
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

  const goTo = (spineIndexOrIdOrCfi: number | string) => {
    readingOrderView?.goTo(spineIndexOrIdOrCfi)
  }

  const load = (
    manifest: Manifest,
    { fetchResource = 'http' }: {
      fetchResource?: `http` | ((item: Manifest['readingOrder'][number]) => Promise<string>)
    } = {
        fetchResource: `http`
      },
    spineIndexOrIdOrCfi?: string | number
  ) => {
    if (context) {
      console.warn(`loading a new book is not supported yet`)
      return
    }

    context = createBookContext(manifest)

    context$ = context.$.subscribe(data => {
      if (data.event === 'iframe') {
        subject.next(data)
      }
    })

    pagination = createPagination({ context })
    readingOrderView = createReadingOrderView({ manifest: manifest, containerElement: element, context, pagination, options: { fetchResource } })
    readingOrderView.load()

    layout()

    // @todo support navigating through specific reading item & position
    // this will trigger every layout needed from this point. This allow user to start navigating
    // through the book even before other chapter are ready
    // readingOrderView.moveTo(20)
    goTo(spineIndexOrIdOrCfi || 0)

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
    iframeEventIntercept.remove()
  }

  const publicApi = {
    turnLeft: () => {
      return readingOrderView?.turnLeft()
    },
    turnRight: () => {
      return readingOrderView?.turnRight()
    },
    goTo,
    goToPageOfCurrentChapter: (pageIndex: number) => {
      return readingOrderView?.goToPageOfCurrentChapter(pageIndex)
    },
    getPagination() {
      if (!readingOrderView || !pagination || !context) return undefined

      return {
        begin: {
          // chapterIndex: number;
          chapterInfo: readingOrderView.getChapterInfo(),
          pageIndexInChapter: pagination.getPageIndex(),
          numberOfPagesInChapter: pagination.getNumberOfPages(),
          // pages: number;
          // pageIndexInBook: number;
          // pageIndexInChapter: number;
          // pagesOfChapter: number;
          // pagePercentageInChapter: number;
          // offsetPercentageInChapter: number;
          // domIndex: number;
          // charOffset: number;
          // serializeString?: string;
          spineItemIndex: readingOrderView.getSpineItemIndex(),
        },
        // end: ReadingLocation;
        /**
         * This percentage is based of the weight (kb) of every items and the number of pages.
         * It is not accurate but gives a general good idea of the overall progress.
         * It is recommended to use this progress only for reflow books. For pre-paginated books
         * the number of pages and current index can be used instead since 1 page = 1 chapter. 
         */
        percentageEstimateOfBook: getPercentageEstimate(context, readingOrderView, pagination),
        pagesOfBook: Infinity,
        cfi: pagination.getCfi(),
        // chaptersOfBook: number;
        // chapter: string;
        // hasNextChapter: (readingOrderView.spineItemIndex || 0) < (manifest.readingOrder.length - 1),
        // hasPreviousChapter: (readingOrderView.spineItemIndex || 0) < (manifest.readingOrder.length - 1),
        numberOfSpineItems: context.manifest.readingOrder.length
      }
    },
    normalizeEventPositions: (e: PointerEvent | MouseEvent | TouchEvent) => {
      if (e.target !== iframeEventIntercept) {
        return e
      }

      if (!context || !pagination) return e

      return {
        ...normalizeEventPositions(context, pagination, e, readingOrderView?.getFocusedReadingItem())
      }
    },
    layout,
    load,
    destroy,
    isSelecting: () => readingOrderView?.isSelecting(),
    getSelection: () => readingOrderView?.getSelection(),
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

const createIframeMouseInterceptorElement = (containerElement: HTMLElement) => {
  const iframeEventIntercept = containerElement.ownerDocument.createElement('div')
  iframeEventIntercept.id = `BookViewIframeEventIntercept`
  iframeEventIntercept.style.cssText = `
    position: absolute;
    height: 100%;
    width: 100%;
  `

  return iframeEventIntercept
}