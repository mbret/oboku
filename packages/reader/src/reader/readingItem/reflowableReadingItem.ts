import { Subscription } from "rxjs"
import { Context } from "../context"
import { Manifest } from "../types"
import { createSharedHelpers } from "./helpers"
import { createFingerTracker, createSelectionTracker } from "./trackers"

export const createReflowableReadingItem = ({ item, context, containerElement, fetchResource }: {
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
    const horizontalMargin = context.getHorizontalMargin()
    const columnWidth = pageWidth - (horizontalMargin * 2)

    return {
      columnHeight,
      columnWidth,
      horizontalMargin,
      verticalMargin: context.getHorizontalMargin()
    }
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

    const viewportDimensions = readingItemFrame.getViewportDimensions()
    const visibleArea = context.getVisibleAreaRect()
    const frameElement = readingItemFrame.getFrameElement()
    if (element && frameElement?.contentDocument && frameElement?.contentWindow) {
      let contentWidth = pageWidth
      const contentHeight = visibleArea.height + context.getCalculatedInnerMargin()

      if (viewportDimensions) {
        const computedScale = Math.min(pageWidth / viewportDimensions.width, pageHeight / viewportDimensions.height)
        helpers.injectStyle(readingItemFrame, buildStyleForFakePrePaginated())
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
        helpers.injectStyle(readingItemFrame, buildStyleWithMultiColumn(getDimensions()))
        const pages = Math.ceil(
          // frameElement.contentDocument.documentElement.scrollWidth / pageWidth
          frameElement.contentWindow.document.body.scrollWidth / pageWidth
        )
        contentWidth = pages * pageWidth

        // debugger
        console.log('PAGES', frameElement.contentWindow.document.body.scrollWidth, pageWidth, pages)

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

  readingItemFrame$ = helpers.readingItemFrame.$.subscribe(({ event }) => {
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

const buildStyleForFakePrePaginated = () => {
  return `
    html {
      width: 100%;
      height: 100%;
    }

    body {
      width: 100%;
      height: 100%;
      margin: 0;
    }

    img {
      display: flex;
      max-width: 100%;
      max-height: 100%;
      margin: 0 auto;
    }
  `
}

const buildStyleWithMultiColumn = ({ columnHeight, columnWidth, horizontalMargin, verticalMargin }: {
  columnWidth: number,
  columnHeight: number,
  horizontalMargin: number
  verticalMargin: number
}) => {
  return `
    parsererror {
      display: none !important;
    }
    ${/*
      might be html * but it does mess up things like figure if so.
      check accessible_epub_3
    */``}
    html, body {
      margin: 0;
      padding: 0 !important;
      max-width: ${columnWidth}px !important;
    }
    ${/*
      body {
        height: ${columnHeight}px !important;
        width: ${columnWidth}px !important;
      }
    */``}
    body {
      padding: 0 !important;
      width: ${columnWidth}px !important;
      height: ${columnHeight}px !important;
      margin-left: ${horizontalMargin}px !important;
      margin-right: ${horizontalMargin}px !important;
      padding-top: ${verticalMargin}px !important;
      padding-bottom: ${verticalMargin}px !important;
      overflow-y: hidden;
      column-width: ${columnWidth}px !important;
      column-gap: ${horizontalMargin * 2}px !important;
      column-fill: auto !important;
      word-wrap: break-word;
      box-sizing: border-box;
    }
    body {
      margin: 0;
    }
    ${/*
      needed for hammer to work with things like velocity
    */``}
    html, body {
      touch-action: pan-y;
    }
    * {
      d-max-width: ${columnWidth}px !important;
    }
    ${/*
      this is necessary to have a proper calculation when determining size
      of iframe content. If an img is using something like width:100% it would expand to
      the size of the original image and potentially gives back a wrong size (much larger)
      @see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Columns/Handling_Overflow_in_Multicol
    */``}
    img, video, audio, object, svg {
      max-width: 100%;
      d-max-width: ${columnWidth}px !important;
      d-max-height: ${columnHeight}px !important;
      pointer-events: none;
    }
    figure {
      d-max-width: ${columnWidth}px !important;
    }
    img {
      object-fit: contain;
      break-inside: avoid;
      box-sizing: border-box;
      d-max-width: ${columnWidth}px !important;
    }
    ${/*
      img, video, audio, object, svg {
        max-height: ${columnHeight}px !important;
        box-sizing: border-box;
        object-fit: contain;
        -webkit-column-break-inside: avoid;
        page-break-inside: avoid;
        break-inside: avoid;
      }
    */``}
    table {
      max-width: ${columnWidth}px !important;
      table-layout: fixed;
    }
  `
}