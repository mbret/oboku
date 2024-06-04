import React, {
  useCallback,
  FC,
  useMemo,
  memo,
  ComponentProps,
  Fragment,
  CSSProperties
} from "react"
import { List, useTheme } from "@mui/material"
import { useCSS } from "../../common/utils"
import { ReactWindowList } from "../../common/lists/ReactWindowList"
import { CollectionListItemList } from "./CollectionListItemList"
import { CollectionDocType } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"
import { useWindowSize } from "react-use"
import { ListActionViewMode } from "../../common/lists/ListActionsToolbar"

export const CollectionList: FC<
  {
    renderHeader?: () => React.ReactNode
    headerHeight?: number
    style?: React.CSSProperties
    data: string[]
    onItemClick?: (item: DeepReadonlyObject<CollectionDocType>) => void
    viewMode?: ListActionViewMode
    itemMode?: ComponentProps<typeof CollectionListItemList>["viewMode"]
    static?: boolean
  } & Omit<
    ComponentProps<typeof ReactWindowList>,
    `rowRenderer` | `itemsPerRow` | `data`
  >
> = memo(({ itemMode, ...props }) => {
  const {
    renderHeader,
    viewMode,
    headerHeight,
    style,
    data,
    onItemClick,
    ...rest
  } = props
  const classes = useStyle()
  const windowSize = useWindowSize()
  const dynamicNumberOfItems = Math.max(Math.floor(windowSize.width / 350), 1)
  const itemsPerRow =
    viewMode === "grid"
      ? dynamicNumberOfItems > 0
        ? dynamicNumberOfItems
        : dynamicNumberOfItems
      : 1

  const itemHeight = 250

  const rowRendererStyle: CSSProperties = useMemo(
    () => ({
      height: itemHeight
    }),
    [itemHeight]
  )

  const rowRenderer = useCallback(
    (item: string) => (
      <CollectionListItemList
        id={item}
        onItemClick={onItemClick}
        viewMode={itemMode}
        style={rowRendererStyle}
      />
    ),
    [onItemClick, itemMode, rowRendererStyle]
  )

  const containerStyle = useMemo(
    () => ({ ...classes.container, ...style }),
    [style, classes]
  )

  if (props.static) {
    return (
      <List disablePadding>
        {data.map((item) => (
          <Fragment key={item}>{rowRenderer(item)}</Fragment>
        ))}
      </List>
    )
  }

  return (
    <div style={containerStyle}>
      <ReactWindowList
        data={data}
        rowRenderer={rowRenderer}
        itemsPerRow={itemsPerRow}
        headerHeight={headerHeight}
        renderHeader={renderHeader}
        itemHeight={itemHeight}
        {...rest}
      />
    </div>
  )
})

const useStyle = () => {
  const theme = useTheme()

  return useCSS(
    () => ({
      container: {
        display: "flex"
      }
    }),
    [theme]
  )
}
