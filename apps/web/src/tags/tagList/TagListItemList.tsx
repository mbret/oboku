import { type ComponentProps, memo } from "react"
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import {
  BlurOnRounded,
  LocalOfferRounded,
  LockRounded,
} from "@mui/icons-material"
import { useSignalValue } from "reactjrx"
import { useTag } from "../helpers"
import {
  libraryStateSignal,
  selectIsLibraryUnlocked,
} from "../../library/books/states"

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
    const isLibraryUnlocked = useSignalValue(
      libraryStateSignal,
      selectIsLibraryUnlocked,
    )

    const isHidden = !!tag?.isProtected && !isLibraryUnlocked

    return (
      <ListItemButton onClick={() => tag && onItemClick?.(tag)} {...rest}>
        <ListItemIcon>
          <LocalOfferRounded />
        </ListItemIcon>
        <ListItemText
          primary={tag?.name}
          secondary={`${isHidden ? "?" : tag?.books?.length || 0} book(s)`}
        />
        {tag?.isProtected && <LockRounded color="primary" />}
        {tag?.isBlurEnabled && <BlurOnRounded color="primary" />}
      </ListItemButton>
    )
  },
)
