import { Subject, Subscription } from "rxjs";
import { Report } from "../report";
import { createContext as createBookContext } from "./context";
import { createPagination } from "./pagination";
import { createReadingOrderView } from "./readingOrderView/readingOrderView";
import { LoadOptions, Manifest } from "./types";

type ReadingOrderView = ReturnType<typeof createReadingOrderView>

export type Reader = ReturnType<typeof createReader>

const READING_ITEM_ON_LOAD_HOOK = 'readingItem.onLoad'
const READING_ITEM_ON_CREATED_HOOK = 'readingItem.onCreated'

type ReadingOrderViewHook = Parameters<ReadingOrderView['registerHook']>[0]
type ManipulateReadingItemsCallback = Parameters<ReadingOrderView['manipulateReadingItems']>[0]

type Hooks = {
  [READING_ITEM_ON_LOAD_HOOK]: Extract<ReadingOrderViewHook, { name: 'readingItem.onLoad' }>
  [READING_ITEM_ON_CREATED_HOOK]: Extract<ReadingOrderViewHook, { name: 'readingItem.onCreated' }>
}

export const createReader = ({ containerElement }: {
  containerElement: HTMLElement
}) => {
  const subject = new Subject<{ event: 'iframe', data: HTMLIFrameElement } | { event: 'ready' }>()
  const paginationSubject = new Subject<{ event: 'change' }>()
  const context = createBookContext()
  const pagination = createPagination({ context })
  const element = createWrapperElement(containerElement)
  const readingOrderView = createReadingOrderView({
    containerElement: element,
    context,
    pagination,
  })
  let paginationSubscription: Subscription | undefined
  containerElement.appendChild(element)

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
    if (context.getManifest()) {
      Report.warn(`loading a new book is not supported yet`)
      return
    }

    Report.log(`load`, { manifest, spineIndexOrIdOrCfi: cfi })

    context.load(manifest, loadOptions)
    readingOrderView.load()

    if (!cfi) {
      readingOrderView.goToSpineItem(0)
    } else {
      readingOrderView.goToCfi(cfi)
    }

    layout()

    paginationSubscription?.unsubscribe()
    paginationSubscription = pagination.$.subscribe(paginationSubject)

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
    paginationSubscription?.unsubscribe()
    element.remove()
  }

  function registerHook(name: typeof READING_ITEM_ON_LOAD_HOOK, fn: Hooks[typeof READING_ITEM_ON_LOAD_HOOK]['fn']): void
  function registerHook(name: typeof READING_ITEM_ON_CREATED_HOOK, fn: Hooks[typeof READING_ITEM_ON_CREATED_HOOK]['fn']): void
  function registerHook(name: string, fn: any) {
    if (name === READING_ITEM_ON_LOAD_HOOK) {
      readingOrderView.registerHook({ name: `readingItem.onLoad`, fn })
    }
    if (name === READING_ITEM_ON_CREATED_HOOK) {
      readingOrderView.registerHook({ name: `readingItem.onCreated`, fn })
    }
  }

  const manipulateReadingItems = (cb: ManipulateReadingItemsCallback) => {
    readingOrderView.manipulateReadingItems(cb)
  }

  const manipulateContainer = (cb: (container: HTMLElement) => void) => {
    cb(element)
  }

  const reader = {
    pagination,
    context,
    registerHook,
    manipulateReadingItems,
    manipulateContainer,
    turnLeft: () => readingOrderView.turnLeft(),
    turnRight: () => readingOrderView.turnRight(),
    goToPageOfCurrentChapter: (pageIndex: number) => readingOrderView.goToPageOfCurrentChapter(pageIndex),
    goTo: (spineIndexOrSpineItemIdOrCfi: string | number) => readingOrderView.goTo(spineIndexOrSpineItemIdOrCfi),
    goToUrl: (url: string | URL) => readingOrderView.goToUrl(url),
    getChapterInfo: () => readingOrderView?.getChapterInfo(),
    getFocusedReadingItem: () => readingOrderView?.getFocusedReadingItem(),
    getFocusedReadingItemIndex: () => readingOrderView?.getFocusedReadingItemIndex(),
    getSelection: () => readingOrderView?.getSelection(),
    isSelecting: () => readingOrderView?.isSelecting(),
    layout,
    load,
    destroy,
    pagination$: paginationSubject.asObservable(),
    $: subject.asObservable()
  }

  return reader
}

const createWrapperElement = (containerElement: HTMLElement) => {
  const element = containerElement.ownerDocument.createElement('div')
  element.id = 'BookView'
  element.style.setProperty(`overflow`, `hidden`)
  element.style.setProperty(`position`, `relative`)

  return element
}