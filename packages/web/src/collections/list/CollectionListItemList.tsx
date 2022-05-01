import { FC, memo } from "react"
import { IconButton, ListItem, ListItemText, useTheme } from "@material-ui/core"
import { useCSS } from "../../common/utils"
import { MoreVert } from "@material-ui/icons"
import { useRecoilValue } from "recoil"
import { collectionState } from "../states"
import { CollectionDocType } from "@oboku/shared"
import { Cover } from "../../books/Cover"
import { useCollectionActionsDrawer } from "../CollectionActionsDrawer"

export const CollectionListItemList: FC<{
  id: string
  onItemClick?: (tag: CollectionDocType) => void
}> = memo(({ id, onItemClick }) => {
  const theme = useTheme()
  const item = useRecoilValue(collectionState(id))
  const { open: openActionDrawer } = useCollectionActionsDrawer(id)
  const styles = useStyle()

  return (
    <ListItem
      button
      style={styles.container}
      onClick={() => item && onItemClick && onItemClick(item)}
    >
      <div style={{ ...styles.itemCard }}>
        <div style={styles.itemBottomRadius} />
        <div
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
        </div>
      </div>
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
        >
          <MoreVert />
        </IconButton>
      </div>
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
        // border: `1px solid black`
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
        position: "absolute"
      }
    }),
    [theme]
  )
}
