import { memo, useEffect } from "react"
import "rc-slider/assets/index.css"
import { readerSignal } from "../states"
import { useObserve, useSignal, useSignalValue, useSubscribe } from "reactjrx"
import { useTotalPages } from "../pagination/useTotalPages"
import { useCurrentPages } from "../pagination/useCurrentPages"
import { useIsUsingReverseNavigation } from "./useIsUsingReverseNavigation"
import { useIsUsingPagesPerChapter } from "../pagination/useIsUsingPagesPerChapter"
import { ObokuRcSlider } from "./slider/ObokuRcSlider"

export const Scrubber = memo(({ bookId }: { bookId: string }) => {
  const reader = useSignalValue(readerSignal)
  const [currentPage] = useCurrentPages({ bookId })
  const totalPages = useTotalPages({ bookId }) || 1
  const context = useObserve(() => reader?.context.state$, [reader])
  const isUsingReverseNavigation = useIsUsingReverseNavigation()
  const isUsingPagesPerChapter = useIsUsingPagesPerChapter({ bookId })
  const isUsingSpread = !!context?.isUsingSpreadMode
  const [scrubberValue, scrubberValueSignal] = useSignal({
    default: currentPage || 0
  })
  const pagination = useObserve(() => reader?.pagination.state$, [reader])
  const min = 0
  const max = isUsingSpread ? Math.floor((totalPages - 1) / 2) : totalPages - 1
  const disabled = totalPages === 1

  // sync page from outside to scrubber
  useEffect(() => {
    scrubberValueSignal.setValue(
      isUsingSpread ? (currentPage ?? 0) / 2 : (currentPage ?? 0)
    )
  }, [scrubberValueSignal, , isUsingSpread, currentPage])

  useSubscribe(
    () =>
      reader?.navigation.throttleLock({
        duration: 100,
        trigger: scrubberValueSignal.subject
      }),
    [reader]
  )

  return (
    <ObokuRcSlider
      value={scrubberValue}
      max={max}
      min={min}
      disabled={disabled}
      onChange={(value) => {
        if (typeof value === `number`) {
          scrubberValueSignal.setValue(value)

          const pageIndex = isUsingSpread ? value * 2 : value

          if (!isUsingPagesPerChapter) {
            reader?.navigation.goToAbsolutePageIndex({
              absolutePageIndex: pageIndex,
              animation: false
            })
          } else {
            reader?.navigation.goToPageOfSpineItem({
              pageIndex,
              spineItemId: pagination?.beginSpineItemIndex ?? 0,
              animation: false
            })
          }
        }
      }}
      reverse={isUsingReverseNavigation}
      step={1}
    />
  )
})
