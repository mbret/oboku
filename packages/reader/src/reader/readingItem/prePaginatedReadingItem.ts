import { Subscription } from "rxjs"
import { Context } from "../context"
import { Manifest } from "../types"
import { createCommonReadingItem } from "./commonReadingItem"
import { createFingerTracker, createSelectionTracker } from "./trackers"

export const createPrePaginatedReadingItem = ({ item, context, containerElement }: {
  item: Manifest['readingOrder'][number],
  containerElement: HTMLElement,
  context: Context,
}) => {
  const commonReadingItem = createCommonReadingItem({ context, item, containerElement })
  let element = commonReadingItem.element
  let loadingElement = commonReadingItem.loadingElement
  let readingItemFrame = commonReadingItem.readingItemFrame
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

    const { viewportDimensions, computedScale } = commonReadingItem.getViewPortInformation() || {}
    const visibleArea = context.getVisibleAreaRect()
    const frameElement = readingItemFrame.getManipulableFrame()?.frame
    if (element && frameElement?.contentDocument && frameElement?.contentWindow) {
      let contentWidth = pageWidth
      const contentHeight = visibleArea.height + context.getCalculatedInnerMargin()

      // debugger
      // console.log('PAGES', frameElement.contentWindow.document.body.scrollWidth, pageWidth)

      const cssLink = buildDefaultStyle(getDimensions())

      if (viewportDimensions) {
        commonReadingItem.injectStyle(readingItemFrame, cssLink)
        readingItemFrame.staticLayout({
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
        commonReadingItem.injectStyle(readingItemFrame, cssLink)
        readingItemFrame.staticLayout({
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

  commonReadingItem.readingItemFrame.$.subscribe((data) => {
    if (data.event === `domReady`) {
      fingerTracker.track(data.data)
      selectionTracker.track(data.data)

      // applySize()
    }

    if (data.event === 'layout') {
      layout()
      commonReadingItem.$.next(data)
    }
  })

  return {
    ...commonReadingItem,
    layout,
    fingerTracker,
    selectionTracker,
    destroy: () => {
      commonReadingItem.destroy()
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
    ${/*
      prevent drag of image instead of touch on firefox
    */``}
    img {
      user-select: none;
      ${/*
        prevent weird overflow or margin. Try `block` if `flex` has weird behavior
      */``}
      display: flex;
    }
  `
}