import { Subject } from "rxjs"
import { Report } from "../../report"
import { Manifest } from "../../types"
import { Context } from "../context"

export type ReadingItemFrame = ReturnType<typeof createReadingItemFrame>

export const createReadingItemFrame = (
  parent: HTMLElement,
  item: Manifest['readingOrder'][number],
  context: Context,
  { fetchResource }: {
    fetchResource: `http` | ((item: Manifest['readingOrder'][number]) => Promise<string>)
  }
) => {
  const subject = new Subject<{ event: 'layout', data: { isFirstLayout: boolean, isReady: boolean } }>()
  let isLoaded = false
  let currentLoadingId = 0
  let loading = false
  let frameElement: HTMLIFrameElement | undefined
  let isReady = false
  const src = item.href

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
    isReady = false
    isLoaded = false
    loading = false
    frameElement?.remove()
    frameElement = undefined
  }

  return {
    getIsReady() {
      return isReady
    },
    getViewportDimensions,
    getIsLoaded: () => isLoaded,
    load: Report.measurePerformance(`ReadingItemFrame load`, Infinity, async (onLoad: (frame: HTMLIFrameElement) => void) => {
      if (loading) return
      loading = true
      const currentLoading = ++currentLoadingId
      const isCancelled = () => !(loading && currentLoading === currentLoadingId)

      frameElement = await createFrame(parent)

      context.$.next({ event: 'iframe', data: frameElement })

      const t0 = performance.now();

      if (fetchResource === 'http') {
        frameElement.src = src
      } else {
        frameElement.srcdoc = await fetchResource(item)
      }

      return new Promise(async (resolve) => {
        if (frameElement && !isCancelled()) {
          // frameElement.frameBorder = 'no'
          frameElement.setAttribute('sandbox', 'allow-same-origin allow-scripts')
          // frameElement.scrolling = 'no'
          // frameElement.onerror = (e: any) => {
          //   Report.error(e)
          // }
          frameElement.onload = (e) => {
            // debugger
            const t1 = performance.now();
            Report.metric({ name: `ReadingItemFrame load:3`, duration: t1 - t0 });

            // const base = frameElement?.contentDocument?.createElement('base')
            // if (base) {
            //   base.href = `/epubs/empowered.epub/OEBPS/`
            //   frameElement?.contentDocument?.head.appendChild(base)
            // }

            // let hammer = new Hammer(frameElement?.contentWindow?.document.body)
            // hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL })
            // hammer.get('pinch').set({ enable: true })
            // hammer.get('press').set({ time: 500 })
            // hammer?.on('panmove panstart panend', (ev: HammerInput) => {
            //   console.log(`onPanMove`, ev.velocityX, ev.isFinal, ev)
            // })

            if (frameElement && !isCancelled()) {
              frameElement.onload = null
              frameElement.setAttribute('role', 'main')
              frameElement.setAttribute('tab-index', '0')

              onLoad(frameElement)

              isLoaded = true

              frameElement.contentDocument?.fonts.ready.then(() => {
                if (frameElement && !isCancelled()) {
                  isReady = true
                  subject.next({ event: 'layout', data: { isFirstLayout: true, isReady: true } })
                }
              })

              resolve(true)
            }
          }
          // frameElement.uri
          // frameElement.srcdoc = await (await fetch(src)).text()
        }
      })
    }),
    unload,
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
    getFrameElement: () => frameElement,
    removeStyle: (id: string) => {
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
    },
    addStyle(id: string, style: string, prepend = false) {
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
    },
    getReadingDirection: (): 'ltr' | 'rtl' | undefined => {
      if (frameElement?.contentWindow && frameElement?.contentDocument?.body) {
        const direction = frameElement.contentWindow.getComputedStyle(frameElement.contentDocument.body).direction
        if (['ltr', 'rtl'].includes(direction)) return direction as ('ltr' | 'rtl')
      }
      return undefined
    },
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