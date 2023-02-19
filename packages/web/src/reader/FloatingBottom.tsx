import { Box } from "@mui/material"
import { PercentageIndicator } from "./common/PercentageIndicator"
import { TimeIndicator } from "./common/TimeIndicator"

export const FloatingBottom = () => {
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
      <TimeIndicator lineHeight={1} />
      <PercentageIndicator lineHeight={1} />
    </Box>
  )
}
