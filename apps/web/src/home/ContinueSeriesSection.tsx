import { memo, useMemo } from "react"
import { Typography, Box } from "@mui/material"
import { useContinueSeries } from "./useContinueSeries"
import { CollectionList } from "./CollectionList"

export const ContinueCollectionsSection = memo(() => {
  const { data: collections } = useContinueSeries()
  const collectionIds = useMemo(
    () => collections?.map(({ _id }) => _id),
    [collections],
  )

  if ((collections?.length ?? 0) <= 0) return null

  return (
    <Box>
      <Typography variant="h6" component="h1" padding={1} paddingTop={2}>
        Continue your series
      </Typography>
      <CollectionList data={collectionIds} />
    </Box>
  )
})
