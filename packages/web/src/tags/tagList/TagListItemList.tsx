import { FC, memo } from "react"
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from "@material-ui/core"
import { useCSS } from "../../common/utils"
import {
  BlurOnRounded,
  LocalOfferRounded,
  LockRounded
} from "@material-ui/icons"
import { useRecoilValue } from "recoil"
import { normalizedTagsState } from "../states"
import { TagsDocType } from "@oboku/shared"

export const TagListItemList: FC<{
  id: string
  onItemClick?: (tag: TagsDocType) => void
}> = memo(({ id, onItemClick }) => {
  const tag = useRecoilValue(normalizedTagsState)[id]
  const styles = useStyle()

  return (
    <ListItem
      button
      style={styles.container}
      onClick={() => tag && onItemClick && onItemClick(tag)}
    >
      <ListItemIcon>
        <LocalOfferRounded />
      </ListItemIcon>
      <ListItemText
        primary={tag?.name}
        secondary={`${
          tag?.isProtected ? "?" : tag?.books?.length || 0
        } book(s)`}
      />
      {tag?.isProtected && <LockRounded color="primary" />}
      {tag?.isBlurEnabled && <BlurOnRounded color="primary" />}
    </ListItem>
  )
})

const useStyle = () => {
  const theme = useTheme()

  return useCSS(
    () => ({
      container: {
        height: `100%`
      }
    }),
    [theme]
  )
}
