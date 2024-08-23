import { ComponentProps, forwardRef, memo, useEffect } from "react"
import RcSlider from "rc-slider"
import "rc-slider/assets/index.css"
import { readerSignal } from "../states"
import { ComponentsVariants, useTheme, useThemeProps } from "@mui/material"
import { useObserve, useSignal, useSignalValue, useSubscribe } from "reactjrx"
import { useTotalPages } from "../pagination/useTotalPages"
import { useCurrentPage } from "../pagination/useCurrentPage"
import { useIsUsingReverseNavigation } from "./useIsUsingReverseNavigation"
import { useIsUsingPagesPerChapter } from "../pagination/useIsUsingPagesPerChapter"

interface ScrubberProps extends ComponentProps<typeof RcSlider> {
  disabled?: boolean
  contrastMode?: boolean
}

declare module "@mui/material/styles" {
  interface ComponentNameToClassKey {
    ObokuScrubber: "root"
  }

  interface ComponentsPropsList {
    ObokuScrubber: Partial<ScrubberProps>
  }

  interface Components {
    ObokuScrubber?: {
      defaultProps?: ComponentsPropsList["ObokuScrubber"]
      variants?: ComponentsVariants["ObokuScrubber"]
    }
  }
}

const ObokuScrubber = forwardRef<HTMLDivElement, ScrubberProps>(
  function ObokuScrubber(inProps, ref) {
    const theme = useTheme()
    const props = useThemeProps({ props: inProps, name: "ObokuScrubber" })
    const { disabled, contrastMode, ...rest } = props

    return (
      <RcSlider
        ref={ref}
        {...rest}
        disabled={disabled}
        styles={{
          rail: {
            backgroundColor: contrastMode ? "white" : theme.palette.grey["800"],
            ...(contrastMode && {
              border: "1px solid black"
            }),
            ...(disabled && {
              backgroundColor: theme.palette.action.disabled,
              border: "none"
            }),
            transform: "translate(0, -50%)",
            height: contrastMode ? 10 : 5,
            top: "50%"
          },
          track: {
            backgroundColor: theme.palette.grey["100"],
            ...(contrastMode && {
              backgroundColor: "black"
            }),
            ...(disabled && {
              backgroundColor: "transparent"
            }),
            transform: "translate(0, -50%)",
            height: contrastMode ? 10 : 5,
            top: "50%"
          },
          handle: {
            backgroundColor: theme.palette.primary.light,
            border: `2px solid white`,
            transform: "translateY(-50%) scale(2.5)",
            margin: 0,
            top: "50%",
            ...(contrastMode &&
              !disabled && {
                opacity: 1
              })
          }
        }}
      />
    )
  }
)

export const Scrubber = memo(({ bookId }: { bookId: string }) => {
  const reader = useSignalValue(readerSignal)
  const currentPage = useCurrentPage({ bookId })
  const totalPages = useTotalPages({ bookId }) || 1
  const { manifest } = useObserve(() => reader?.context.state$, [reader]) || {}
  const { renditionLayout } = manifest ?? {}
  const isUsingReverseNavigation = useIsUsingReverseNavigation()
  const isUsingPagesPerChapter = useIsUsingPagesPerChapter({ bookId })
  const [value, valueSignal] = useSignal({ default: currentPage || 0 })
  const pagination = useObserve(() => reader?.pagination.state$, [reader])
  const max = totalPages <= 1 ? 2 : totalPages - 1
  const step = 1
  const disabled = totalPages === 1

  useEffect(() => {
    valueSignal.setValue(currentPage || 0)
  }, [valueSignal, currentPage])

  useSubscribe(
    () =>
      reader?.navigation.throttleLock({
        duration: 100,
        trigger: valueSignal.subject
      }),
    [reader]
  )

  return (
    <ObokuScrubber
      value={totalPages === 1 ? 1 : value}
      max={max}
      min={0}
      disabled={disabled}
      onChange={(value) => {
        if (typeof value === `number`) {
          valueSignal.setValue(value)

          if (!isUsingPagesPerChapter) {
            reader?.navigation.goToSpineItem(value)
          } else {
            reader?.navigation.goToPageOfSpineItem(
              value,
              pagination?.beginSpineItemIndex ?? 0
            )
          }
        }
      }}
      reverse={isUsingReverseNavigation}
      step={step}
    />
  )
})
