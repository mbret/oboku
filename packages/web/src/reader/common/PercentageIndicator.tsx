import { Typography, type TypographyProps } from "@mui/material"
import { usePagination } from "../states"

export const PercentageIndicator = (props: TypographyProps) => {
  const { data: { percentageEstimateOfBook } = {} } = usePagination()
  const roundedProgress = Math.floor((percentageEstimateOfBook ?? 0) * 100)
  const displayableProgress = roundedProgress > 0 ? roundedProgress : 1

  if (percentageEstimateOfBook === undefined) return null

  return (
    <Typography variant="caption" {...props}>
      {displayableProgress} %
    </Typography>
  )
}
