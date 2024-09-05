import { useCallback, FC, memo, ComponentProps, useMemo } from "react"
import { List, Stack } from "@mui/material"
import { CollectionListItem } from "./CollectionListItem"
import { CollectionDocType } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"
import { useWindowSize } from "react-use"
import { ListActionViewMode } from "../../common/lists/ListActionsToolbar"
import { VirtuosoList } from "../../common/lists/VirtuosoList"

export const CollectionList: FC<
  {
    onItemClick?: (item: DeepReadonlyObject<CollectionDocType>) => void
    viewMode?: ListActionViewMode
    itemMode?: ComponentProps<typeof CollectionListItem>["viewMode"]
    static?: boolean
  } & ComponentProps<typeof VirtuosoList>
> = memo(({ itemMode, ...props }) => {
  const { viewMode, data, onItemClick, static: isStatic, ...rest } = props
  const windowSize = useWindowSize()
  const dynamicNumberOfItems = Math.max(Math.floor(windowSize.width / 350), 1)
  const itemsPerRow =
    viewMode === "grid"
      ? dynamicNumberOfItems > 0
        ? dynamicNumberOfItems
        : dynamicNumberOfItems
      : 1

  const itemHeight = 250

  const itemStyle = useMemo(
    () => ({
      height: itemHeight
    }),
    [itemHeight]
  )

  const rowRenderer = useCallback(
    (_: number, item: string) => (
      <CollectionListItem
        id={item}
        onItemClick={onItemClick}
        viewMode={itemMode}
        style={itemStyle}
      />
    ),
    [onItemClick, itemMode, itemStyle]
  )

  if (isStatic) {
    return (
      <List disablePadding>
        {data?.map((item, index) => (
          <Stack height={itemHeight} key={item}>
            {rowRenderer(index, item)}
          </Stack>
        ))}
      </List>
    )
  }

  return (
    <VirtuosoList
      data={data}
      itemsPerRow={itemsPerRow}
      rowRenderer={rowRenderer}
      {...rest}
    />
  )

  // return (
  //   <VirtualizedList
  //     data={data}
  //     itemsPerRow={itemsPerRow}
  //     rowRenderer={rowRenderer}
  //     {...rest}
  //   />
  // )
})
