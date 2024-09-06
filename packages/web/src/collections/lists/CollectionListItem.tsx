import { memo } from "react"
import {
  IconButton,
  ListItem as MuiListItem,
  ListItemButton as MuiListItemButton,
  ListItemText,
  styled,
  ListItemProps,
  Stack
} from "@mui/material"
import { LockRounded, MoreVert } from "@mui/icons-material"
import { CollectionDocType } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"
import { CollectionListItemCover } from "./CollectionListItemCover"
import { COLLECTION_EMPTY_ID } from "../../constants.shared"
import { useCollectionActionsDrawer } from "../CollectionActionsDrawer/useCollectionActionsDrawer"
import { getCollectionComputedMetadata } from "../getCollectionComputedMetadata"
import { useCollection } from "../useCollection"
import { useCollectionDisplayTitle } from "../useCollectionDisplayTitle"

const ListItem = styled(MuiListItem)(() => ({
  height: `100%`,
  flexFlow: "column",
  position: "relative"
}))

const ListItemButton = styled(MuiListItemButton)(({ theme }) => ({
  padding: theme.spacing(2)
}))

export const CollectionListItem = memo(
  ({
    id,
    onItemClick,
    viewMode,
    ...rest
  }: {
    id: string
    onItemClick?: (tag: DeepReadonlyObject<CollectionDocType>) => void
    viewMode?: "container" | "text"
  } & ListItemProps) => {
    const { data: item } = useCollection({
      id
    })
    const metadata = getCollectionComputedMetadata(item)
    const { open: openActionDrawer } = useCollectionActionsDrawer(id)
    const title = useCollectionDisplayTitle(metadata.title)

    return (
      <ListItem
        onClick={() => item && onItemClick && onItemClick(item)}
        disablePadding
        {...rest}
      >
        <ListItemButton
          disableGutters
          sx={{
            display: "flex",
            flexDirection: "column",
            alignSelf: "stretch",
            py: 2,
            px: 2,
            borderRadius: 1
          }}
        >
          <CollectionListItemCover id={id} />
          <Stack
            width="100%"
            direction="row"
            alignItems="center"
            {...(id !== COLLECTION_EMPTY_ID && {
              onClick: (e) => {
                e.stopPropagation()
                openActionDrawer()
              }
            })}
          >
            <ListItemText
              primary={title ?? `\u00a0`}
              secondary={`${item?.books?.length || 0} book(s)`}
              primaryTypographyProps={{
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis"
              }}
            />

            {id !== COLLECTION_EMPTY_ID && (
              <IconButton
                disableFocusRipple
                disableRipple
                disableTouchRipple
                size="large"
              >
                <MoreVert />
              </IconButton>
            )}
            {id === COLLECTION_EMPTY_ID && (
              <IconButton
                disableFocusRipple
                disableRipple
                disableTouchRipple
                size="large"
              >
                <LockRounded />
              </IconButton>
            )}
          </Stack>
        </ListItemButton>
      </ListItem>
    )
  }
)
