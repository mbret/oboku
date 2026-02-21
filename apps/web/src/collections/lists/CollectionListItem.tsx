import { memo } from "react"
import {
  IconButton,
  ListItemButton as MuiListItemButton,
  ListItemText,
  styled,
  Stack,
  ListItem,
  type ListItemProps,
} from "@mui/material"
import { LockRounded, MoreVert } from "@mui/icons-material"
import { CollectionListItemCover } from "./CollectionListItemCover"
import { useCollectionActionsDrawer } from "../CollectionActionsDrawer/useCollectionActionsDrawer"
import { getCollectionComputedMetadata } from "../getCollectionComputedMetadata"
import { useCollection } from "../useCollection"
import { useCollectionDisplayTitle } from "../useCollectionDisplayTitle"
import { configuration } from "../../config/configuration"
import { useNavigate } from "react-router"
import { ROUTES } from "../../navigation/routes"

const ListItemButton = styled(MuiListItemButton)(({ theme }) => ({
  padding: theme.spacing(2),
}))

export const CollectionListItem = memo(
  ({
    id,
    showType,
    ...rest
  }: {
    id: string
    showType?: boolean
  } & ListItemProps) => {
    const { data: item } = useCollection({
      id,
    })
    const navigate = useNavigate()
    const metadata = getCollectionComputedMetadata(item)
    const { open: openActionDrawer } = useCollectionActionsDrawer(id)
    const title = useCollectionDisplayTitle(metadata.title)

    return (
      <ListItem
        onClick={() => {
          if (item) {
            navigate(ROUTES.COLLECTION_DETAILS.replace(":id", item._id))
          }
        }}
        component="div"
        disablePadding
        dense
        {...rest}
      >
        <ListItemButton
          disableGutters
          sx={{
            display: "flex",
            flexDirection: "column",
            alignSelf: "stretch",
          }}
        >
          <CollectionListItemCover id={id} showType={showType} />
          <Stack
            width="100%"
            direction="row"
            alignItems="center"
            onClick={(e) => {
              if (id !== configuration.COLLECTION_EMPTY_ID) {
                e.stopPropagation()
                openActionDrawer()
              }
            }}
          >
            <ListItemText
              primary={title ?? `\u00a0`}
              secondary={`${item?.books?.length || 0} book(s)`}
              primaryTypographyProps={{
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            />

            {id !== configuration.COLLECTION_EMPTY_ID && (
              <IconButton
                disableFocusRipple
                disableRipple
                disableTouchRipple
                size="large"
              >
                <MoreVert />
              </IconButton>
            )}
            {id === configuration.COLLECTION_EMPTY_ID && (
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
  },
)
