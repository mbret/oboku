import { Subject } from "rxjs"
import { LoadOptions, Manifest } from "./types"

export type Context = ReturnType<typeof createContext>

export type ContextObservableEvents = {}

export const createContext = () => {
  let manifest: Manifest | undefined
  let loadOptions: LoadOptions | undefined
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

  const shouldDisplaySpread = () => false

  return {
    load: (newManifest: Manifest, newLoadOptions: LoadOptions) => {
      manifest = newManifest
      loadOptions = newLoadOptions
    },
    isRTL: () => manifest?.readingDirection === 'rtl',
    getLoadOptions: () => loadOptions,
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
    getManifest: () => manifest,
    getReadingDirection: () => manifest?.readingDirection
  }
}