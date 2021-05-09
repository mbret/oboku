import { Context } from "../context"
import { createReadingItemFrame, ReadingItemFrame } from "./readingItemFrame"
import { Manifest } from "../types"
import { Subject, Subscription } from "rxjs"
import { Report } from "../../report"
import { createLocator } from "./locator"

export const createSharedHelpers = ({ item, context, containerElement }: {
  item: Manifest['readingOrder'][number],
  containerElement: HTMLElement,
  context: Context,
}) => {
  const subject = new Subject<{ event: 'selectionchange' | 'selectstart', data: Selection } | { event: 'layout', data: { isFirstLayout: boolean, isReady: boolean } }>()
  const element = createWrapperElement(containerElement, item)
  const loadingElement = createLoadingElement(containerElement, item)
  const readingItemFrame = createReadingItemFrame(element, item, context)
  const readingItemLocator = createLocator({ context })

  let readingItemFrame$: Subscription | undefined

  const injectStyle = (readingItemFrame: ReadingItemFrame, cssText: string) => {
    readingItemFrame?.removeStyle('oboku-reader-css')
    readingItemFrame?.addStyle('oboku-reader-css', cssText)
  }

  const adjustPositionOfElement = (edgeOffset: number | undefined) => {
    if (edgeOffset === undefined) return
    if (context.isRTL()) {
      // could also be negative left but I am not in the mood
      // will push items on the left
      element.style.right = `${edgeOffset}px`
    } else {
      // will push items on the right
      element.style.left = `${edgeOffset}px`
    }
  }

  const getViewPortInformation = () => {
    const { width: pageWidth, height: pageHeight } = context.getPageSize()
    const viewportDimensions = readingItemFrame.getViewportDimensions()
    const frameElement = readingItemFrame.getFrameElement()
    if (element && frameElement?.contentDocument && frameElement?.contentWindow && viewportDimensions) {
      const computedScale = Math.min(pageWidth / viewportDimensions.width, pageHeight / viewportDimensions.height)

      return { computedScale, viewportDimensions }
    }

    return undefined
  }

  readingItemFrame$ = readingItemFrame.$.subscribe((event) => {
    if (event.event === 'layout') {
      if (event.data.isFirstLayout && event.data.isReady) {
        loadingElement.style.opacity = `0`
      }
    }
  })

  const getFrameLayoutInformation = () => readingItemFrame.getFrameElement()?.getBoundingClientRect()

  const loadContent = () => {
    readingItemFrame.load().catch(Report.error)
  }

  const unloadContent = async () => {
    readingItemFrame.unload()

    if (loadingElement) {
      loadingElement.style.opacity = `1`
    }
  }

  const getBoundingRectOfElementFromSelector = (selector: string) => {
    const frame = readingItemFrame.getFrameElement()
    if (frame) {
      return frame.contentDocument?.querySelector(selector)?.getBoundingClientRect()
    }
  }

  const getBoundingClientRect = () => {
    const rect = element.getBoundingClientRect()

    return {
      ...rect,
      width: Math.floor(rect.width),
      x: Math.floor(rect.x),
      left: Math.floor(rect.left),
      y: Math.floor(rect.y),
      top: Math.floor(rect.top),
      height: Math.floor(rect.height),
    }
  }

  return {
    /**
     * @todo load iframe content later so that resources are less intensives.
     * Right now we load iframe content and kinda block the following of the reader until
     * every reading item have their iframe ready. Ideally we want to start loading iframe
     * only from the first reading item navigated to and then progressively with the adjacent one
     */
    load: () => {
      containerElement.appendChild(element)
      element.appendChild(loadingElement)
    },
    adjustPositionOfElement,
    createWrapperElement,
    createLoadingElement,
    getBoundingClientRect,
    injectStyle,
    loadContent,
    unloadContent,
    readingItemFrame,
    element,
    loadingElement,
    getFrameLayoutInformation,
    getBoundingRectOfElementFromSelector,
    getViewPortInformation,
    isContentReady: () => !!readingItemFrame?.getIsReady(),
    destroy: () => {
      loadingElement.remove()
      element.remove()
      readingItemFrame?.destroy()
      readingItemFrame$?.unsubscribe()
    },
    getReadingDirection: () => {
      return readingItemFrame.getReadingDirection() || context.manifest.readingDirection
    },
    getIsReady: () => readingItemFrame.getIsReady(),
    $: subject,
  }
}

const createWrapperElement = (containerElement: HTMLElement, item: Manifest['readingOrder'][number]) => {
  const element = containerElement.ownerDocument.createElement('div')
  element.id = item.id
  element.classList.add('readingItem')
  element.classList.add(`readingItem-${item.renditionLayout}`)
  element.style.cssText = `
    position: absolute;
    overflow: hidden;
  `

  return element
}

const createLoadingElement = (containerElement: HTMLElement, item: Manifest['readingOrder'][number]) => {
  const loadingElement = containerElement.ownerDocument.createElement('div')
  loadingElement.classList.add(`loading`)
  loadingElement.style.cssText = `
    height: 100%;
    width: 100vw;
    opacity: 1;
    text-align: center;
    position: absolute;
    pointer-events: none;
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  `
  // loadingElement.innerText = `loading chapter ${item.id}`
  const logoElement = containerElement.ownerDocument.createElement('div')
  logoElement.innerText = `oboku`
  logoElement.style.cssText = `
    font-size: 4em;
    color: #cacaca;
  `
  const detailsElement = containerElement.ownerDocument.createElement('div')
  detailsElement.innerText = `loading ${item.id}`
  detailsElement.style.cssText = `
    font-size: 1.2em;
    color: rgb(202, 202, 202);
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    max-width: 300px;
    width: 80%;
  `
  loadingElement.appendChild(logoElement)
  loadingElement.appendChild(detailsElement)

  return loadingElement
}