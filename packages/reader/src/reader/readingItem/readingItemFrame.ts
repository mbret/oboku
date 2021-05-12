import { IframeHTMLAttributes } from "react"
import { Subject } from "rxjs"
import { Report } from "../../report"
import { Manifest } from "../../types"
import { Context } from "../context"

export type ReadingItemFrame = ReturnType<typeof createReadingItemFrame>
export type ManipulatableFrame = {
  frame: HTMLIFrameElement,
  removeStyle: (id: string) => void,
  addStyle: (id: string, style: CSSStyleDeclaration['cssText']) => void,
}
export type Hook = { name: `onLoad`, fn: (manipulableFrame: ManipulatableFrame) => void }

export const createReadingItemFrame = (
  parent: HTMLElement,
  item: Manifest['readingOrder'][number],
  context: Context,
) => {
  const subject = new Subject<{ event: 'domReady', data: HTMLIFrameElement } | { event: 'layout', data: { isFirstLayout: boolean, isReady: boolean } }>()
  let isLoaded = false
  let currentLoadingId = 0
  let loading = false
  let frameElement: HTMLIFrameElement | undefined
  let isReady = false
  const src = item.href
  let hooks: Hook[] = []

  const getManipulableFrame = () => {
    if (isLoaded && frameElement) {
      return createFrameManipulator(frameElement)
    }
  }

  const getViewportDimensions = () => {
    if (frameElement && frameElement.contentDocument) {
      const doc = frameElement.contentDocument
      const viewPortMeta = doc.querySelector("meta[name='viewport']")
      if (viewPortMeta) {
        const viewPortMetaInfos = viewPortMeta.getAttribute('content')
        if (viewPortMetaInfos) {
          const width = getAttributeValueFromString(viewPortMetaInfos, 'width')
          const height = getAttributeValueFromString(viewPortMetaInfos, 'height')
          if (width > 0 && height > 0) {
            return {
              width: width,
              height: height,
            }
          } else {
            return undefined
          }
        }
      }
    }

    return undefined
  }

  const unload = () => {
    if (loading || isReady) {
      isReady = false
      isLoaded = false
      loading = false
      frameElement?.remove()
      frameElement = undefined
      subject.next({ event: 'layout', data: { isFirstLayout: false, isReady: false } })
    }
  }

  const getWritingMode = () => {
    if (frameElement?.contentDocument) {
      return frameElement?.contentWindow?.getComputedStyle(frameElement.contentDocument.body).writingMode as 'vertical-rl' | 'horizontal-tb' | undefined
    }
  }

  function registerHook(name: `onLoad`, hookFn: (manipulatableFrame: ManipulatableFrame) => void): void
  function registerHook(name: `onLoad`, hookFn: (manipulatableFrame: ManipulatableFrame) => void) {
    hooks.push({ name, fn: hookFn })
  }

  return {
    getIsReady: () => isReady,
    getIsLoaded: () => isLoaded,
    getViewportDimensions,
    load: Report.measurePerformance(`ReadingItemFrame load`, Infinity, async () => {
      if (loading || isReady) return
      loading = true
      const currentLoading = ++currentLoadingId
      const isCancelled = () => !(loading && currentLoading === currentLoadingId)

      frameElement = await createFrame(parent)

      const t0 = performance.now();

      const fetchResource = context.getLoadOptions()?.fetchResource
      if (!fetchResource || fetchResource === 'http') {
        frameElement.src = src
      } else {
        frameElement.srcdoc = await fetchResource(item)
      }

      return new Promise(async (resolve) => {
        if (frameElement && !isCancelled()) {
          frameElement.setAttribute('sandbox', 'allow-same-origin allow-scripts')
          frameElement.onload = (e) => {
            const t1 = performance.now();
            Report.metric({ name: `ReadingItemFrame load:3`, duration: t1 - t0 });

            if (frameElement && !isCancelled()) {
              frameElement.onload = null
              frameElement.setAttribute('role', 'main')
              frameElement.setAttribute('tab-index', '0')

              isLoaded = true

              const manipulableFrame = getManipulableFrame()

              hooks
                .filter(hook => hook.name === `onLoad`)
                .forEach(hook => manipulableFrame && hook.fn(manipulableFrame))

              subject.next({ event: 'domReady', data: frameElement })

              frameElement.contentDocument?.fonts.ready.then(() => {
                if (frameElement && !isCancelled()) {
                  isReady = true
                  loading = false
                  subject.next({ event: 'layout', data: { isFirstLayout: true, isReady: true } })
                }
              })

              resolve(true)
            }
          }
        }
      })
    }),
    unload,
    registerHook,
    /**
     * Upward layout is used when the parent wants to manipulate the iframe without triggering
     * `layout` event. This is a particular case needed for iframe because the parent can layout following
     * an iframe `layout` event. Because the parent `layout` may change some of iframe properties we do not
     * want the iframe to trigger a new `layout` even and have infinite loop.
     */
    staticLayout: (size: { width: number, height: number }) => {
      if (frameElement) {
        frameElement.style.width = `${size.width}px`
        frameElement.style.height = `${size.height}px`
      }
    },
    // @todo block access, only public API to manipulate / get information (in order to memo / optimize)
    // manipulate() with cb and return boolean whether re-layout or not
    getManipulableFrame,
    getReadingDirection: (): 'ltr' | 'rtl' | undefined => {
      const writingMode = getWritingMode()
      if (writingMode === `vertical-rl`) {
        return 'rtl'
      }

      if (frameElement?.contentWindow && frameElement?.contentDocument?.body) {
        const direction = frameElement.contentWindow.getComputedStyle(frameElement.contentDocument.body).direction
        if (['ltr', 'rtl'].includes(direction)) return direction as ('ltr' | 'rtl')
      }
      return undefined
    },
    getWritingMode,
    destroy: () => {
      unload()
    },
    $: subject,
  }
}

const createFrame = Report.measurePerformance(`ReadingItemFrame createFrame`, Infinity, async (container: HTMLElement) => {
  return new Promise<HTMLIFrameElement>((resolve) => {
    const frame = document.createElement('iframe')
    frame.frameBorder = 'no'
    frame.setAttribute('sandbox', 'allow-same-origin allow-scripts')
    // const accessibilityLayout = ReadingSingleton.getInstance().getViewContext()
    //   .accessibilityLayout
    // if (!accessibilityLayout) {
    //   frame.scrolling = 'no'
    // }
    // frame.onload = () => {
    //   frame.onload = null
    //   frame.setAttribute('role', 'main')
    //   frame.setAttribute('tab-index', '0')
    //   resolve(frame)
    // }

    resolve(frame)

    container.appendChild(frame)
  })
})

const getAttributeValueFromString = (string: string, key: string) => {
  const regExp = new RegExp(key + '\\s*=\\s*([0-9.]+)', 'i')
  const match = string.match(regExp) || []
  const firstMatch = match[1] || `0`

  return (match && parseFloat(firstMatch)) || 0
}

const createRemoveStyleHelper = (frameElement: HTMLIFrameElement | undefined) => (id: string) => {
  if (
    frameElement &&
    frameElement.contentDocument &&
    frameElement.contentDocument.head
  ) {
    const styleElement = frameElement.contentDocument.getElementById(id)
    if (styleElement) {
      styleElement.remove()
    }
  }
}

const createAddStyleHelper = (frameElement: HTMLIFrameElement | undefined) => (id: string, style: string, prepend = false) => {
  if (
    frameElement &&
    frameElement.contentDocument &&
    frameElement.contentDocument.head
  ) {
    const userStyle = document.createElement('style')
    userStyle.id = id
    userStyle.innerHTML = style
    if (prepend) {
      frameElement.contentDocument.head.prepend(userStyle)
    } else {
      frameElement.contentDocument.head.appendChild(userStyle)
    }
  }
}

export const createFrameManipulator = (frameElement: HTMLIFrameElement) => ({
  frame: frameElement,
  removeStyle: createRemoveStyleHelper(frameElement),
  addStyle: createAddStyleHelper(frameElement)
})