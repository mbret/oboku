import { ComponentProps, memo } from "react"
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import {
  BlurOnRounded,
  LocalOfferRounded,
  LockRounded,
} from "@mui/icons-material"
import { useTag } from "../helpers"

export const TagListItemList = memo(
  ({
    id,
    onItemClick,
    ...rest
  }: {
    id: string
    onItemClick?: (tag: { _id: string; isProtected: boolean }) => void
  } & ComponentProps<typeof ListItemButton>) => {
    const { data: tag } = useTag(id)

    return (
      <ListItemButton
        onClick={() => tag && onItemClick && onItemClick(tag)}
        {...rest}
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
      </ListItemButton>
    )
  },
)
