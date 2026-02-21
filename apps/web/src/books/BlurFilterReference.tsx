// needs to be global
import { GlobalStyles } from "@mui/material"
import { memo, useId } from "react"

export const BlurFilterReference = memo(() => {
  const blurFilterReferenceId = useId()

  return (
    <>
      <GlobalStyles
        styles={{
          ".blurFilter": {
            webkitFilter: `url("#${blurFilterReferenceId}")`,
            filter: `url("#${blurFilterReferenceId}")`,
          },
        }}
      />
      <svg
        style={{
          // hideSvgSoThatItSupportsFirefox
          border: 0,
          clip: "rect(0 0 0 0)",
          height: 1,
          margin: -1,
          overflow: "hidden",
          padding: 0,
          position: "absolute",
          width: 1,
        }}
      >
        <title>Blur filter reference</title>
        <filter id={blurFilterReferenceId}>
          <feGaussianBlur stdDeviation="5" />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 9 0"
          />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </svg>
    </>
  )
})
