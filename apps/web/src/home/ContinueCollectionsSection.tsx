import { memo, useMemo } from "react"
import { Typography, Box } from "@mui/material"
import { useContinueCollections } from "./useContinueCollections"
import { CollectionList } from "../collections/lists/CollectionList"

export const ContinueCollectionsSection = memo(() => {
  const { data: collections } = useContinueCollections()
  const collectionIds = useMemo(
    () => collections?.map(({ _id }) => _id),
    [collections],
  )
  const listStyle = useMemo(
    () => ({
      height: 320,
    }),
    [],
  )

  if ((collections?.length ?? 0) <= 0) return null

  return (
    <Box>
      <Typography variant="h6" component="h1" padding={1} paddingTop={2}>
        Continue your collections
      </Typography>
      <CollectionList
        data={collectionIds}
        viewMode="horizontal"
        style={listStyle}
        slotProps={{
          listItem: {
            showType: false,
          },
        }}
      />
    </Box>
  )
})
