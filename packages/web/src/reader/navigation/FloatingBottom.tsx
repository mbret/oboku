import { Box } from "@mui/material"
import { PercentageIndicator } from "../common/PercentageIndicator"
import { TimeIndicator } from "../common/TimeIndicator"
import { memo } from "react"

export const FloatingBottom = memo(
  ({
    enableTime,
    enableProgress
  }: {
    enableTime: boolean
    enableProgress: boolean
  }) => {
    return (
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        p={1}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        style={{
          opacity: 0.8
        }}
      >
        {enableTime && <TimeIndicator lineHeight={1} />}
        {enableProgress && <PercentageIndicator lineHeight={1} />}
      </Box>
    )
  }
)
