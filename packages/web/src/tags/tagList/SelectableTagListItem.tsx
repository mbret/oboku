import { type FC, memo } from "react"
import { Box, ListItemButton, ListItemText } from "@mui/material"
import { BlurOnRounded, LockRounded } from "@mui/icons-material"
import { useTag } from "../helpers"
import { Checkbox } from "../../common/Checkbox"

export const SelectableTagListItem: FC<{
  id: string
  onItemClick?: () => void
  selected: boolean
}> = memo(({ id, onItemClick, selected }) => {
  const { data: tag } = useTag(id)

  return (
    <ListItemButton
      style={{
        height: `100%`,
      }}
      onClick={() => onItemClick && onItemClick()}
    >
      <ListItemText primary={tag?.name} />
      <Box
        sx={{
          marginRight: 1,
        }}
      >
        {tag?.isProtected && <LockRounded color="primary" />}
        {tag?.isBlurEnabled && <BlurOnRounded color="primary" />}
      </Box>
      <Checkbox selected={selected} />
    </ListItemButton>
  )
})
