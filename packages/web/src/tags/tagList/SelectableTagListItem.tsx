import { FC, memo } from "react"
import { ListItem, ListItemText, useTheme } from "@mui/material"
import { useCSS } from "../../common/utils"
import { BlurOnRounded, LockRounded } from "@mui/icons-material"
import { useTag } from "../states"
import { TagsDocType } from "@oboku/shared"
import { Checkbox } from "../../common/Checkbox"
import { useDatabase } from "../../rxdb"

export const SelectableTagListItem: FC<{
  id: string
  onItemClick?: (tag: TagsDocType) => void
  selected: boolean
}> = memo(({ id, onItemClick, selected }) => {
  const { db$ } = useDatabase()
  const tag = useTag(db$, id)
  const styles = useStyle()

  return (
    <ListItem
      button
      style={styles.container}
      onClick={() => tag && onItemClick && onItemClick(tag)}
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
