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
import { useConfig } from "../../config/useConfig"
import { generatePath, useNavigate } from "react-router"
import { ROUTES } from "../../navigation/routes"

const ListItemButton = styled(MuiListItemButton)(({ theme }) => ({
  padding: theme.spacing(2),
}))

const LockIconSpan = styled("span")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  boxSizing: "border-box",
  verticalAlign: "middle",
  padding: 12,
  color: theme.palette.action.active,
}))

export const CollectionListItem = memo(function CollectionListItem({
  id,
  showType,
  ...rest
}: {
  id: string
  showType?: boolean
} & ListItemProps) {
  const { data: config } = useConfig()
  const { data: item } = useCollection({
    id,
  })
  const navigate = useNavigate()
  const metadata = getCollectionComputedMetadata(item)
  const { open: openActionDrawer } = useCollectionActionsDrawer(id)
  const title = useCollectionDisplayTitle(metadata.title)
  const isEmptyCollection = id === config?.COLLECTION_EMPTY_ID

  return (
    <ListItem
      onClick={() => {
        if (item) {
          navigate(generatePath(ROUTES.COLLECTION_DETAILS, { id: item._id }))
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
          direction="row"
          onClick={(e) => {
            if (!isEmptyCollection) {
              e.stopPropagation()
              openActionDrawer()
            }
          }}
          sx={{
            width: "100%",
            alignItems: "center",
          }}
        >
          <ListItemText
            primary={title ?? `\u00a0`}
            secondary={`${item?.books?.length || 0} book(s)`}
            slotProps={{
              primary: {
                sx: {
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                },
              },
            }}
          />

          {isEmptyCollection ? (
            <LockIconSpan role="img" aria-label="This shelf cannot be edited">
              <LockRounded />
            </LockIconSpan>
          ) : (
            <IconButton
              aria-label="More actions"
              disableFocusRipple
              disableRipple
              disableTouchRipple
              size="large"
            >
              <MoreVert />
            </IconButton>
          )}
        </Stack>
      </ListItemButton>
    </ListItem>
  )
})
