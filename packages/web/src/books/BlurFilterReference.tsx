// needs to be global
import { GlobalStyles } from "@mui/material"
import { memo } from "react"

export const BlurFilterReference = memo(() => {
  return (
    <>
      <GlobalStyles
        styles={{
          ".blurFilter": {
            webkitFilter: `url("#blurFilterReference")`,
            filter: `url("#blurFilterReference")`,
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
        <filter id="blurFilterReference">
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
