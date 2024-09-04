import { FC, memo } from "react"
import { Box, ListItemButton, ListItemText } from "@mui/material"
import { Checkbox } from "../../common/Checkbox"
import { getMetadataFromCollection } from "../getMetadataFromCollection"
import { useCollection } from "../useCollection"

export const SelectableCollectionListItem: FC<{
  id: string
  onItemClick?: (tag: string) => void
  selected: boolean
}> = memo(({ id, onItemClick, selected }) => {
  const { data } = useCollection({ id })

  return (
    <ListItemButton
      sx={{
        height: `100%`
      }}
      onClick={() => data && onItemClick && onItemClick(data?._id)}
    >
      <ListItemText primary={getMetadataFromCollection(data)?.title} />
      <Box mr={1}></Box>
      <Checkbox selected={selected} />
    </ListItemButton>
  )
})
