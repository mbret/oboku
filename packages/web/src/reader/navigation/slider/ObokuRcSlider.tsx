import { ComponentProps, forwardRef } from "react"
import RcSlider from "rc-slider"
import "rc-slider/assets/index.css"
import "./index.css"
import { ComponentsVariants, useTheme, useThemeProps } from "@mui/material"

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

export const ObokuRcSlider = forwardRef<HTMLDivElement, ScrubberProps>(
  function ObokuScrubber(inProps, ref) {
    const theme = useTheme()
    const props = useThemeProps({ props: inProps, name: "ObokuScrubber" })
    const { disabled, contrastMode, ...rest } = props

    return (
      <RcSlider
        ref={ref}
        {...rest}
        disabled={disabled}
        keyboard={false}
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
