import {
  ComponentProps,
  forwardRef,
  memo,
  useEffect,
  useState
} from "react"
import RcSlider from "rc-slider"
import "rc-slider/assets/index.css"
import { readerStateSignal, useCurrentPage, useTotalPage } from "../states"
import {
  ComponentsVariants,
  useTheme,
  useThemeProps
} from "@mui/material"
import { useObserve, useSignalValue } from "reactjrx"
import { NEVER } from "rxjs"

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

export const Scrubber = memo(() => {
  const reader = useSignalValue(readerStateSignal)
  const currentPage = useCurrentPage()
  const totalPages = useTotalPage() || 1
  const { manifest } = useObserve(reader?.context.state$ ?? NEVER) || {}
  const { readingDirection, renditionLayout } = manifest ?? {}
  const [value, setValue] = useState(currentPage || 0)
  const max = totalPages <= 1 ? 2 : totalPages - 1
  const step = 1
  const disabled = totalPages === 1

  useEffect(() => {
    setValue(currentPage || 0)
  }, [currentPage])

  return (
    <ObokuScrubber
      value={totalPages === 1 ? 1 : value}
      max={max}
      min={0}
      disabled={disabled}
      onChange={(value) => {
        if (typeof value === `number`) {
          setValue(value)

          // @todo onChange will change directly when moving scrubber, on after change is good however it triggers twice
          if (renditionLayout !== "reflowable") {
            reader?.viewportNavigator.goToSpineItem(value)
          } else {
            reader?.viewportNavigator.goToPageOfCurrentChapter(value)
          }
        }
      }}
      reverse={readingDirection === "rtl"}
      step={step}
    />
  )
})
