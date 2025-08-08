import { useCallback, memo, type ComponentProps } from "react"
import { List, Stack, useTheme } from "@mui/material"
import { CollectionListItem } from "./CollectionListItem"
import type { CollectionDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { useWindowSize } from "react-use"
import type { ListActionViewMode } from "../../common/lists/ListActionsToolbar"
import { VirtuosoList } from "../../common/lists/VirtuosoList"

export const CollectionList = memo(
  ({
    viewMode,
    data,
    onItemClick,
    static: isStatic,
    slotProps,
    ...rest
  }: {
    onItemClick?: (item: DeepReadonlyObject<CollectionDocType>) => void
    viewMode?: ListActionViewMode
    static?: boolean
    slotProps?: {
      listItem?: Omit<
        ComponentProps<typeof CollectionListItem>,
        "id" | "onItemClick"
      >
    }
  } & ComponentProps<typeof VirtuosoList>) => {
    const { listItem: listItemProps } = slotProps ?? {}
    const windowSize = useWindowSize()
    const theme = useTheme()
    const coverRatio = theme.custom.coverAverageRatio
    const dynamicNumberOfItems = Math.max(Math.floor(windowSize.width / 350), 1)
    const itemsPerRow =
      viewMode === "grid"
        ? dynamicNumberOfItems > 0
          ? dynamicNumberOfItems
          : dynamicNumberOfItems
        : 1
    const itemHeight = 250

    const rowRenderer = useCallback(
      (_: number, item: string) => (
        <CollectionListItem
          id={item}
          onItemClick={onItemClick}
          style={{
            ...(viewMode === "horizontal"
              ? {
                  height: "100%",
                  aspectRatio: coverRatio,
                  overflow: "hidden",
                }
              : {
                  height: itemHeight,
                }),
          }}
          {...listItemProps}
        />
      ),
      [onItemClick, viewMode, coverRatio, listItemProps],
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
        horizontalDirection={viewMode === "horizontal"}
        {...rest}
      />
    )
  },
)
