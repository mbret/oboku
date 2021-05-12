import { Context } from "../context"
import { createFrameManipulator, createReadingItemFrame, ReadingItemFrame } from "./readingItemFrame"
import { Manifest } from "../types"
import { Subject, Subscription } from "rxjs"
import { Report } from "../../report"

export { Hook } from "./readingItemFrame"

export type LoadingFrameHook = { name: `onLoad`, fn: (manipulableFrame: ReturnType<typeof createFrameManipulator>) => void }

export const createSharedHelpers = ({ item, context, containerElement }: {
  item: Manifest['readingOrder'][number],
  containerElement: HTMLElement,
  context: Context,
}) => {
  const subject = new Subject<{ event: 'selectionchange' | 'selectstart', data: Selection } | { event: 'layout', data: { isFirstLayout: boolean, isReady: boolean } }>()
  const element = createWrapperElement(containerElement, item)
  const loadingElement = createLoadingElement(containerElement, item)
  const readingItemFrame = createReadingItemFrame(element, item, context)
  containerElement.appendChild(element)
  element.appendChild(loadingElement)
  let loadingFrameHooks: LoadingFrameHook[] = []
  let readingItemFrame$: Subscription | undefined

  const injectStyle = (readingItemFrame: ReadingItemFrame, cssText: string) => {
    readingItemFrame.getManipulableFrame()?.removeStyle('oboku-reader-css')
    readingItemFrame.getManipulableFrame()?.addStyle('oboku-reader-css', cssText)
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
    const frameElement = readingItemFrame.getManipulableFrame()?.frame
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

  const getFrameLayoutInformation = () => readingItemFrame.getManipulableFrame()?.frame?.getBoundingClientRect()

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
    const frame = readingItemFrame.getManipulableFrame()?.frame
    if (frame && selector) {
      if (selector.startsWith(`#`)) {
        return frame.contentDocument?.getElementById(selector.replace(`#`, ``))?.getBoundingClientRect()
      }
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

  const registerHook: ReturnType<typeof createReadingItemFrame>['registerHook'] = (name, fn) => {
    readingItemFrame.registerHook(name, fn)
    // we intercept the onload hook and we will use it on loading element as well
    if (name === `onLoad`) {
      loadingFrameHooks.push({ name, fn })
    }
  }

  loadingElement.onload = () => {
    loadingFrameHooks.forEach(({ name, fn }) => {
      if (name === `onLoad`) {
        fn(createFrameManipulator(loadingElement))
      }
    })
  }

  return {
    load: () => { },
    registerHook,
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
    isUsingVerticalWriting: () => readingItemFrame.getWritingMode()?.startsWith(`vertical`),
    getReadingDirection: () => {
      return readingItemFrame.getReadingDirection() || context.getReadingDirection()
    },
    getIsReady: () => readingItemFrame.getIsReady(),
    manipulateReadingItem: (cb: (manipulableFrame: ReturnType<typeof createFrameManipulator>) => boolean) => {
      // we don't need the result of the manipulation of loading frame
      cb(createFrameManipulator(loadingElement))

      const manipulableFrame = readingItemFrame.getManipulableFrame()

      if (manipulableFrame) return cb(manipulableFrame)

      return false
    },
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

/**
 * We use iframe for loading element mainly to be able to use share hooks / manipulation
 * with iframe. That way the loading element always match whatever style is applied to iframe.
 */
const createLoadingElement = (containerElement: HTMLElement, item: Manifest['readingOrder'][number]) => {
  const frame = document.createElement('iframe')
  frame.frameBorder = 'no'
  frame.setAttribute('sandbox', 'allow-same-origin allow-scripts')
  frame.setAttribute('role', 'main')
  frame.setAttribute('tab-index', '0')

  const loadingElement = containerElement.ownerDocument.createElement('div')
  loadingElement.classList.add(`loading`)
  loadingElement.style.cssText = `
    height: 100%;
    width: 100vw;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  `
  frame.style.cssText = `
    height: 100%;
    width: 100vw;
    opacity: 1;
    position: absolute;
    pointer-events: none;
    background-color: white;
  `

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

  frame.srcdoc = `
    <html>
      <head>
        <style>
          html, body {
            height: 100%;
            width: 100vw;
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>${loadingElement.outerHTML}</body>
    </html>
  `

  return frame
}