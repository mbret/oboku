import { Context } from "../context"
import { createReadingItemFrame, ReadingItemFrame } from "./readingItemFrame"
import { Manifest } from "../types"
import { getFirstVisibleNodeForViewport } from "../utils/dom"
import { CFI, extractObokuMetadataFromCfi } from "../cfi"
import { Subject, Subscription } from "rxjs"
import { Report } from "../../report"

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

export const createSharedHelpers = ({ item, context, containerElement, fetchResource }: {
  item: Manifest['readingOrder'][number],
  containerElement: HTMLElement,
  context: Context,
  fetchResource: `http` | ((item: Manifest['readingOrder'][number]) => Promise<string>)
}) => {
  const subject = new Subject<{ event: 'selectionchange' | 'selectstart', data: Selection } | { event: 'layout', data: { isFirstLayout: boolean, isReady: boolean } }>()
  const element = createWrapperElement(containerElement, item)
  const loadingElement = createLoadingElement(containerElement, item)
  const readingItemFrame = createReadingItemFrame(element, item, context, { fetchResource })
  let readingItemFrame$: Subscription | undefined

  const injectStyle = (readingItemFrame: ReadingItemFrame, cssText: string) => {
    readingItemFrame?.removeStyle('ur-css-link')
    readingItemFrame?.addStyle('ur-css-link', cssText)
  }

  const bridgeAllMouseEvents = (frame: HTMLIFrameElement) => {
    pointerEvents.forEach(event => {
      frame?.contentDocument?.addEventListener(event, (e) => {
        // @ts-ignore
        document.getElementById(`BookViewIframeEventIntercept`).dispatchEvent(new PointerEvent(e.type, e))
        // document.getElementById(`BookView`).dispatchEvent(new PointerEvent(e.type, e))
      })
    })
    mouseEvents.forEach(event => {
      frame?.contentDocument?.addEventListener(event, (e) => {
        // @ts-ignore
        document.getElementById(`BookViewIframeEventIntercept`).dispatchEvent(new MouseEvent(e.type, e))
        // document.getElementById(`BookView`).dispatchEvent(new MouseEvent(e.type, e))
      })
    })
  }

  const adjustPositionOfElement = (edgeOffset: number | undefined) => {
    if (!edgeOffset) return
    if (context.isRTL()) {
      element.style.right = `${edgeOffset}px`
    } else {
      element.style.left = `${edgeOffset}px`
    }
  }

  const getFirstNodeOrRangeAtPage = (pageIndex: number) => {
    const pageSize = context.getPageSize()
    const frame = readingItemFrame?.getFrameElement()

    const yOffset = 0 + context.getVerticalMargin()
    // return frame?.contentDocument?.body.childNodes[0]

    // return frame?.contentWindow?.document.caretRangeFromPoint(offset, 0).startContainer
    if (
      frame?.contentWindow?.document
      // very important because it is being used by next functions
      && frame.contentWindow.document.body !== null
    ) {

      const viewport = {
        left: pageIndex * pageSize.width,
        right: (pageIndex * pageSize.width) + pageSize.width,
        top: 0,
        bottom: pageSize.height
      }
      const res = getFirstVisibleNodeForViewport(frame.contentWindow.document, viewport)

      // console.warn(`getFirstNodeOrRangeAtPage`, res)
      // const res = getFirstVisibleNodeFromPoint(frame?.contentWindow?.document, offsetInReadingItem, yOffset)


      // if (res && `offsetNode` in res) {
      //   console.warn(offsetInReadingItem, res, res.offsetNode.parentElement?.getBoundingClientRect())

      //   return { node: res.offsetNode, offset: 0 }
      // }
      // if (res && `startContainer` in res) {
      //   return { node: res.startContainer, offset: res.startOffset }
      // }

      return res
    }
    // if (frame) {
    //   const element = Array.from(frame.contentWindow?.document.body.children || []).find(children => {
    //     const { x, width } = children.getBoundingClientRect()

    //     return (x + width) > offset
    //   })

    //   return element?.children[0]
    // }

    return undefined
  }

  const getCfi = Report.measurePerformance(`getCfi`, 10, (pageIndex: number) => {
    const nodeOrRange = getFirstNodeOrRangeAtPage(pageIndex)
    const doc = readingItemFrame.getFrameElement()?.contentWindow?.document

    const itemAnchor = `|[oboku~anchor~${encodeURIComponent(item.id)}]`
    // because the current cfi library does not works well with offset we are just using custom
    // format and do it manually after resolving the node
    // @see https://github.com/fread-ink/epub-cfi-resolver/issues/8
    const offset = `|[oboku~offset~${nodeOrRange?.offset || 0}]`

    // console.warn(`getCfi`, nodeOrRange)
    if (nodeOrRange && doc) {
      const cfiString = CFI.generate(nodeOrRange.node, 0, `${itemAnchor}${offset}`)
      // console.log('FOOO', CFI.generate(nodeOrRange.startContainer, nodeOrRange.startOffset))

      return cfiString
    }

    return `epubcfi(/0${itemAnchor}) `
  })

  const resolveCfi = (cfiString: string | undefined) => {
    if (!cfiString) return undefined

    const { cleanedCfi, offset } = extractObokuMetadataFromCfi(cfiString)
    const cfi = new CFI(cleanedCfi, {})

    const doc = readingItemFrame.getFrameElement()?.contentWindow?.document

    if (doc) {
      try {
        // console.warn('FIII', cleanedCfi, cfi)
        // console.log('FIII', (new CFI('epubcfi(/2/4/2[_preface]/10/1:175[oboku:id-id2632344]', {})).resolve(doc, {}))
        // const { cleanedCfi: foo, itemId } = extractObokuMetadataFromCfi('epubcfi(/2/4/2[I_book_d1e1]/14/2[id2602563]/4/1:190|[oboku:id-id2442754])')
        // const { cleanedCfi: foo, itemId } = extractObokuMetadataFromCfi('epubcfi(/2/4/2[I_book_d1e1]/14/2[id2602563]/4/1:100|[oboku:id-id2442754])')
        // const cfiObject = (new CFI(foo, {}))
        // const resolve = cfiObject.resolve(doc, {})
        // console.warn('FIII', foo, (new CFI(foo, {})), resolve.node, resolve)
        const { node } = cfi.resolve(doc, {})

        // console.warn(cleanedCfi, cfi.resolve(doc, {}), offset)

        return { node, offset }
      } catch (e) {
        Report.error(e)
        return undefined
      }
    }

    return undefined
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
    injectStyle,
    bridgeAllMouseEvents,
    getCfi,
    readingItemFrame,
    element,
    loadingElement,
    resolveCfi,
    getFrameLayoutInformation,
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