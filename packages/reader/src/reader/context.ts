import { Subject } from "rxjs"
import { Manifest } from "./types"

export type Context = ReturnType<typeof createContext>

export type ContextObservableEvents = { event: 'linkClicked', data: HTMLAnchorElement } | { event: 'iframeEvent', data: { frame: HTMLIFrameElement, event: PointerEvent | MouseEvent } }

export const createContext = (manifest: Manifest) => {
  const subject = new Subject<ContextObservableEvents>()
  const visibleAreaRect = {
    width: 0,
    height: 0,
    x: 0,
    y: 0
  }
  const horizontalMargin = 24
  const verticalMargin = 20
  const marginTop = 0
  const marginBottom = 0

  // @todo
  const shouldDisplaySpread = () => false

  return {
    isRTL: () => manifest.readingDirection === 'rtl',
    // isRTL: () => false,
    getCalculatedInnerMargin: () => 0,
    getVisibleAreaRect: () => visibleAreaRect,
    setVisibleAreaRect: (
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      // visibleAreaRect.width = width - horizontalMargin * 2
      visibleAreaRect.width = width
      visibleAreaRect.height = height - marginTop - marginBottom
      visibleAreaRect.x = x
      visibleAreaRect.y = y

      // if (this.useChromiumRubyBugSafeInnerMargin) {
      //   this.visibleAreaRect.height =
      //     this.visibleAreaRect.height - this.getCalculatedInnerMargin()
      // }
    },
    getHorizontalMargin: () => horizontalMargin,
    getVerticalMargin: () => verticalMargin,
    getPageSize: () => {
      return {
        width: shouldDisplaySpread()
          ? visibleAreaRect.width / 2
          : visibleAreaRect.width,
        height: visibleAreaRect.height,
      }
    },
    $: subject.asObservable(),
    emit: (data: ContextObservableEvents) => {
      subject.next(data)
    },
    manifest,
  }
}