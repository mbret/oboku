import type React from "react"
import { Box, Typography, useTheme } from "@mui/material"
import { MenuBookRounded } from "@mui/icons-material"
import { useMeasure } from "react-use"

type ReadingProgressProps = {
  style?: React.CSSProperties
  progress: number
  className?: string
}

export function ReadingProgress({
  style,
  progress,
  className,
}: ReadingProgressProps) {
  const theme = useTheme()
  const [ref, layout] = useMeasure<HTMLDivElement>()
  let width = 0

  if ("width" in layout) {
    width = layout.width
  }

  return (
    <Box
      ref={ref}
      className={className}
      style={{
        width: "100%",
        textAlign: "center",
        ...style,
      }}
      sx={{
        position: "relative",
      }}
    >
      <MenuBookRounded style={{ opacity: "50%", fontSize: width * 0.4 }} />
      <Typography
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          color: "white",
          textShadow: "0px 0px 3px black",
          fontSize: width * 0.12,
          fontWeight: theme.typography.fontWeightBold,
        }}
      >
        {Math.floor(progress) || 1}%
      </Typography>
    </Box>
  )
}
