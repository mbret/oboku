import { Subject, Subscription } from "rxjs"
import { Context } from "../context"
import { Manifest } from "../types"
import { createSharedHelpers } from "./helpers"
import { createFingerTracker, createSelectionTracker } from "./trackers"

export const createPrePaginatedReadingItem = ({ item, context, containerElement, fetchResource }: {
  item: Manifest['readingOrder'][number],
  containerElement: HTMLElement,
  context: Context,
  fetchResource: `http` | ((item: Manifest['readingOrder'][number]) =>Promise<string>)
}) => {
  const helpers = createSharedHelpers({ context, item, containerElement, fetchResource })
  let element = helpers.element
  let loadingElement = helpers.loadingElement
  let readingItemFrame = helpers.readingItemFrame
  const fingerTracker = createFingerTracker()
  const selectionTracker = createSelectionTracker()
  let readingItemFrame$: Subscription | undefined

  const getDimensions = () => {
    const pageSize = context.getPageSize()
    const pageWidth = pageSize.width
    const columnHeight = pageSize.height
    const horizontalMargin = 0
    const columnWidth = pageWidth

    return { columnHeight, columnWidth, horizontalMargin }
  }

  const applySize = () => {
    const { width: pageWidth, height: pageHeight } = context.getPageSize()

    if (!element) return { width: pageWidth, height: pageHeight }

    /**
     * if there is no frame it means the content is not active yet
     * we will just use page to resize
     */
    if (!readingItemFrame?.getIsLoaded()) {
      const { width, height } = context.getPageSize()
      element.style.width = `${width}px`
      element.style.height = `${height}px`

      return { width, height }
    }

    const { viewportDimensions, computedScale } = helpers.getViewPortInformation() || {}
    const visibleArea = context.getVisibleAreaRect()
    const frameElement = readingItemFrame.getFrameElement()
    if (element && frameElement?.contentDocument && frameElement?.contentWindow) {
      let contentWidth = pageWidth
      const contentHeight = visibleArea.height + context.getCalculatedInnerMargin()

      // debugger
      console.log('PAGES', frameElement.contentWindow.document.body.scrollWidth, pageWidth)

      const cssLink = buildDefaultStyle(getDimensions())

      if (viewportDimensions) {
        helpers.injectStyle(readingItemFrame, cssLink)
        readingItemFrame.layout({
          width: viewportDimensions.width,
          height: viewportDimensions.height,
        })
        frameElement?.style.setProperty('--scale', `${computedScale}`)
        frameElement?.style.setProperty('position', `absolute`)
        frameElement?.style.setProperty(`top`, `50%`)
        frameElement?.style.setProperty(`left`, `50%`)
        frameElement?.style.setProperty(`transform`, `translate(-50%, -50%) scale(${computedScale})`)
        frameElement?.style.setProperty(`transform-origin`, `center center`)
      } else {
        helpers.injectStyle(readingItemFrame, cssLink)
        readingItemFrame.layout({
          width: contentWidth,
          height: contentHeight,
        })
      }

      element.style.width = `${contentWidth}px`
      element.style.height = `${contentHeight}px`

      return { width: contentWidth, height: contentHeight }
    }

    return { width: pageWidth, height: pageHeight }
  }

  const layout = () => {
    const newSize = applySize()

    return {
      width: newSize.width,
      height: newSize.height,
      x: element?.getBoundingClientRect().x
    }
  }

  const loadContent = async () => {
    if (!readingItemFrame || readingItemFrame.getIsLoaded()) return

    // @todo handle timeout for iframe loading
    await readingItemFrame.load(frame => {
      fingerTracker.track(frame)
      selectionTracker.track(frame)
      helpers.bridgeAllMouseEvents(frame)

      applySize()
    })
  }

  const unloadContent = async () => {
    if (!readingItemFrame) return

    readingItemFrame.unload()

    if (loadingElement) {
      loadingElement.style.opacity = `1`
    }
  }

  helpers.readingItemFrame.$.subscribe(({ event }) => {
    if (event === 'layout') {
      layout()
      helpers.$.next({ event: 'layout' })
    }
  })

  return {
    ...helpers,
    getBoundingClientRect: () => element?.getBoundingClientRect(),
    loadContent,
    unloadContent,
    layout,
    fingerTracker,
    selectionTracker,
    destroy: () => {
      helpers.destroy()
      readingItemFrame$?.unsubscribe()
      fingerTracker.destroy()
      selectionTracker.destroy()
    },
  }
}

const buildDefaultStyle = ({ columnHeight, columnWidth, horizontalMargin }: {
  columnWidth: number,
  columnHeight: number,
  horizontalMargin: number
}) => {
  return `
    body {
      
    }
    body {
      margin: 0;
    }
    ${/*
      might be html * but it does mess up things like figure if so.
      check accessible_epub_3
    */``}
    html, body {
      height: 100%;
      width: 100%;
    }
    ${/*
      This one is important for preventing 100% img to resize above
      current width. Especially needed for cbz conversion
    */``}
    html, body {
      -max-width: ${columnWidth}px !important;
    }
    ${/*
      needed for hammer to work with things like velocity
    */``}
    html, body {
      touch-action: pan-y;
    }
  `
}