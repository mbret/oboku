import { FC, memo } from "react"
import {
  Box,
  IconButton,
  ListItem as MuiListItem,
  ListItemButton as MuiListItemButton,
  ListItemText,
  styled,
  useTheme,
  ListItemProps,
  Stack
} from "@mui/material"
import { LockRounded, MoreVert } from "@mui/icons-material"
import { CollectionDocType } from "@oboku/shared"
import { Cover } from "../../books/Cover"
import { DeepReadonlyObject } from "rxdb"
import { useCollectionActionsDrawer } from "../CollectionActionsDrawer/useCollectionActionsDrawer"
import { useCollection } from "../useCollection"
import { COLLECTION_EMPTY_ID } from "../../constants.shared"

const ListItem = styled(MuiListItem)(() => ({
  height: `100%`,
  flexFlow: "column",
  position: "relative"
}))

const ListItemButton = styled(MuiListItemButton)(({ theme }) => ({
  padding: theme.spacing(2)
}))

export const CollectionListItemList = memo(
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
    const theme = useTheme()
    const { data: item } = useCollection({
      id
    })
    const { open: openActionDrawer } = useCollectionActionsDrawer(id)

    console.log({ item })

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
          <Stack
            sx={{
              bgcolor: "grey.200",
              flex: 1,
              borderRadius: 2,
              overflow: "hidden",
              position: "relative",
              alignItems: "center",
              ...(id === COLLECTION_EMPTY_ID && {
                opacity: 0.5
              })
            }}
            width="100%"
            justifyContent="center"
          >
            <Box
              style={{
                backgroundColor: theme.palette.grey[300],
                height: "50%",
                width: "100%",
                borderTopLeftRadius: "50%",
                borderTopRightRadius: "50%",
                alignSelf: "flex-end",
                position: "absolute",
                bottom: 0,
                left: 0
              }}
            />
            <Box
              style={{
                width: "100%",
                zIndex: 1,
                display: "flex",
                justifyContent: "center"
              }}
            >
              {item?.books?.slice(0, 3).map((bookItem, i) => {
                const length = item?.books?.length || 0
                const coverHeight = 200 * (length < 3 ? 0.6 : 0.5)

                if (!bookItem) return null

                return (
                  <Cover
                    key={bookItem}
                    bookId={bookItem}
                    withShadow
                    style={{
                      height: coverHeight,
                      width: coverHeight * theme.custom.coverAverageRatio,
                      ...(length > 2 &&
                        i === 1 && {
                          marginTop: -10
                        }),
                      marginRight: 5,
                      marginLeft: 5
                    }}
                  />
                )
              })}
            </Box>
          </Stack>
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
              primary={item?.displayableName ?? `\u00a0`}
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
