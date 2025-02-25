import { FC, memo } from "react"
import { Box, ListItemButton, ListItemText } from "@mui/material"
import { Checkbox } from "../../common/Checkbox"
import { useCollection } from "../useCollection"
import { useCollectionComputedMetadata } from "../useCollectionComputedMetadata"

export const SelectableCollectionListItem: FC<{
  id: string
  onItemClick?: (tag: string) => void
  selected: boolean
}> = memo(({ id, onItemClick, selected }) => {
  const { data } = useCollection({ id })
  const metadata = useCollectionComputedMetadata(data)

  return (
    <ListItemButton
      sx={{
        height: `100%`,
      }}
      onClick={() => data && onItemClick && onItemClick(data?._id)}
    >
      <ListItemText primary={metadata.displayTitle} />
      <Box mr={1}></Box>
      <Checkbox selected={selected} />
    </ListItemButton>
  )
})
