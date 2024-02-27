import React, {
  useCallback,
  FC,
  useMemo,
  memo,
  ComponentProps,
  Fragment
} from "react"
import { List, useTheme } from "@mui/material"
import { useCSS } from "../../common/utils"
import { ReactWindowList } from "../../common/lists/ReactWindowList"
import { CollectionListItemList } from "./CollectionListItemList"
import { CollectionDocType } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"
import { useWindowSize } from "react-use"

export const CollectionList: FC<
  {
    renderHeader?: () => React.ReactNode
    headerHeight?: number
    style?: React.CSSProperties
    data: string[]
    onItemClick?: (item: DeepReadonlyObject<CollectionDocType>) => void
    viewMode?: "list" | "grid"
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
  const dynamicNumberOfItems = Math.floor(windowSize.width / 350)
  const itemsPerRow =
    viewMode === "grid"
      ? dynamicNumberOfItems > 0
        ? dynamicNumberOfItems
        : dynamicNumberOfItems
      : 1

  const rowRenderer = useCallback(
    (item: string) => (
      <CollectionListItemList
        id={item}
        onItemClick={onItemClick}
        viewMode={itemMode}
      />
    ),
    [onItemClick, itemMode]
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
        itemHeight={250}
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
