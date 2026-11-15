import { Box, LinearProgress, Typography } from "@mui/material"
import { formatBytes } from "@oboku/shared"

/**
 * A bar and an "X used of Y (Z%)" line. The bar stops at 100% when
 * `usedBytes` passes `totalBytes`; the line keeps the real percentage.
 */
export function UsageProgress({
  usedBytes,
  totalBytes,
}: {
  usedBytes: number
  totalBytes: number
}) {
  const usedPercent = (usedBytes / (totalBytes || 1)) * 100

  return (
    <div>
      <Box sx={{ marginY: 1 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(usedPercent, 100)}
        />
      </Box>
      <Typography gutterBottom variant="body2">
        {`${formatBytes(usedBytes)} used of ${formatBytes(totalBytes)} (${usedPercent.toFixed(2)}%)`}
      </Typography>
    </div>
  )
}
