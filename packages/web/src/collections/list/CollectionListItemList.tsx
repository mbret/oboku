import { FC, memo } from "react"
import {
  Box,
  IconButton,
  ListItem as MuiListItem,
  ListItemButton as MuiListItemButton,
  ListItemText,
  styled,
  useTheme,
  ListItemProps
} from "@mui/material"
import { useCSS } from "../../common/utils"
import { MoreVert } from "@mui/icons-material"
import { CollectionDocType } from "@oboku/shared"
import { Cover } from "../../books/Cover"
import { useCollection } from "../states"
import { DeepReadonlyObject } from "rxdb"
import { useCollectionActionsDrawer } from "../../library/collections/CollectionActionsDrawer/useCollectionActionsDrawer"

const ListItem = styled(MuiListItem)(() => ({
  height: `100%`,
  flexFlow: "column",
  position: "relative"
}))

const ListItemButton = styled(MuiListItemButton)(({ theme }) => ({
  padding: theme.spacing(2)
}))

export const CollectionListItemList: FC<
  {
    id: string
    onItemClick?: (tag: DeepReadonlyObject<CollectionDocType>) => void
    viewMode?: "container" | "text"
  } & ListItemProps
> = memo(({ id, onItemClick, viewMode, ...rest }) => {
  const theme = useTheme()
  const { data: item } = useCollection({
    id
  })
  const { open: openActionDrawer } = useCollectionActionsDrawer(id)
  const styles = useStyle()

  return (
    <ListItem
      onClick={() => item && onItemClick && onItemClick(item)}
      disablePadding
      {...rest}
    >
      <ListItemButton
        disableGutters
        style={{
          display: "flex",
          flexDirection: "column",
          alignSelf: "stretch",
          padding: 10
        }}
      >
        <Box
          style={{ ...styles.itemCard }}
          width="100%"
          display="flex"
          flexDirection="column"
          p={2}
          pt={3}
          justifyContent="center"
        >
          <div style={styles.itemBottomRadius} />
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
        </Box>
        <div
          style={{
            display: "flex",
            flexFlow: "row",
            width: "100%",
            alignItems: "center"
          }}
          onClick={(e) => {
            e.stopPropagation()
            openActionDrawer()
          }}
        >
          <ListItemText
            primary={item?.displayableName}
            secondary={`${item?.books?.length || 0} book(s)`}
          />
          <IconButton
            disableFocusRipple
            disableRipple
            disableTouchRipple
            edge="end"
            size="large"
          >
            <MoreVert />
          </IconButton>
        </div>
      </ListItemButton>
    </ListItem>
  )
})

const useStyle = () => {
  const theme = useTheme()

  return useCSS(
    () => ({
      container: {
        height: `100%`,
        paddingRight: theme.spacing(2),
        paddingLeft: theme.spacing(2),
        flexFlow: "column",
        position: "relative"
      },
      itemCard: {
        backgroundColor: theme.palette.grey[200],
        width: "100%",
        height: `100%`,
        display: "flex",
        borderRadius: 10,
        overflow: "hidden",
        position: "relative",
        alignItems: "center"
      },
      itemBottomRadius: {
        backgroundColor: theme.palette.grey[300],
        height: "50%",
        width: "100%",
        borderTopLeftRadius: "50%",
        borderTopRightRadius: "50%",
        alignSelf: "flex-end",
        position: "absolute",
        bottom: 0,
        left: 0
      }
    }),
    [theme]
  )
}
