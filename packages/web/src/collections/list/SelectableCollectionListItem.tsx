import { FC, memo } from "react"
import { ListItem, ListItemText, useTheme } from "@mui/material"
import { useCSS } from "../../common/utils"
import { useCollectionsDictionary } from "../states"
import { Checkbox } from "../../common/Checkbox"
import { getMetadataFromCollection } from "../getMetadataFromCollection"

export const SelectableCollectionListItem: FC<{
  id: string
  onItemClick?: (tag: string) => void
  selected: boolean
}> = memo(({ id, onItemClick, selected }) => {
  const { data: collections = {} } = useCollectionsDictionary()
  const data = collections[id]
  const styles = useStyle()

  return (
    <ListItem
      button
      style={styles.container}
      onClick={() => data && onItemClick && onItemClick(data?._id)}
    >
      <ListItemText primary={getMetadataFromCollection(data)?.title} />
      <div style={styles.infoIcon}></div>
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
