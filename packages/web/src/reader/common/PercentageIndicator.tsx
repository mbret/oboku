import { Typography, TypographyProps } from "@mui/material"
import { useReader } from "../ReaderProvider"
import { usePagination } from "../states"

export const PercentageIndicator = (props: TypographyProps) => {
  const { reader$ } = useReader()
  const { percentageEstimateOfBook } = usePagination(reader$) ?? {}
  const roundedProgress = Math.floor((percentageEstimateOfBook ?? 0) * 100)
  const displayableProgress = roundedProgress > 0 ? roundedProgress : 1

  if (percentageEstimateOfBook === undefined) return null

  return (
    <Typography variant="caption" {...props}>
      {displayableProgress} %
    </Typography>
  )
}
