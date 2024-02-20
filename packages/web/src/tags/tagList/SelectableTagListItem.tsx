import { FC, memo } from "react"
import { ListItem, ListItemText, useTheme } from "@mui/material"
import { useCSS } from "../../common/utils"
import { BlurOnRounded, LockRounded } from "@mui/icons-material"
import { useTag } from "../helpers"
import { TagsDocType } from "@oboku/shared"
import { Checkbox } from "../../common/Checkbox"

export const SelectableTagListItem: FC<{
  id: string
  onItemClick?: () => void
  selected: boolean
}> = memo(({ id, onItemClick, selected }) => {
  const { data: tag } = useTag(id)
  const styles = useStyle()

  return (
    <ListItem
      button
      style={styles.container}
      onClick={() => onItemClick && onItemClick()}
    >
      <ListItemText primary={tag?.name} />
      <div style={styles.infoIcon}>
        {tag?.isProtected && <LockRounded color="primary" />}
        {tag?.isBlurEnabled && <BlurOnRounded color="primary" />}
      </div>
      <Checkbox selected={selected} />
    </ListItem>
  )
})

const useStyle = () => {
  const theme = useTheme()

  return useCSS(
    () => ({
      container: {
        height: `100%`
      },
      infoIcon: {
        marginRight: theme.spacing(1)
      }
    }),
    [theme]
  )
}
