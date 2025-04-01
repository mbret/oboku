import { Stack, Skeleton } from "@mui/material"
import { memo } from "react"

export const SkeletonLoader = memo(() => {
  return (
    <Stack p={2} gap={2} maxWidth={600}>
      <Skeleton variant="text" width="60%" />
      <Stack>
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="50%" />
      </Stack>
    </Stack>
  )
})
