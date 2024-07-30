import React, {
  useCallback,
  FC,
  memo,
  ComponentProps,
  useRef,
  forwardRef,
  useMemo,
  Ref
} from "react"
import { Box, List, Stack } from "@mui/material"
import { CollectionListItemList } from "./CollectionListItemList"
import { CollectionDocType } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"
import { useWindowSize } from "react-use"
import { ListActionViewMode } from "../../common/lists/ListActionsToolbar"
import {
  GridStateSnapshot,
  StateSnapshot,
  Virtuoso,
  VirtuosoGrid,
  VirtuosoHandle
} from "react-virtuoso"

export const CollectionList: FC<{
  renderHeader?: () => React.ReactNode
  headerHeight?: number
  style?: React.CSSProperties
  data: string[]
  onItemClick?: (item: DeepReadonlyObject<CollectionDocType>) => void
  viewMode?: ListActionViewMode
  itemMode?: ComponentProps<typeof CollectionListItemList>["viewMode"]
  static?: boolean
  onStateChange?: (
    state:
      | { type: "list"; state: StateSnapshot }
      | { type: "grid"; state: GridStateSnapshot }
  ) => void
  restoreStateFrom?:
    | { type: "list"; state: StateSnapshot }
    | { type: "grid"; state: GridStateSnapshot }
}> = memo(({ itemMode, ...props }) => {
  const {
    renderHeader,
    viewMode,
    headerHeight,
    style,
    data,
    onItemClick,
    onStateChange,
    restoreStateFrom,
    ...rest
  } = props
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const windowSize = useWindowSize()
  const restoreStateFromFirstValue = useRef(restoreStateFrom)
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
      <CollectionListItemList
        id={item}
        onItemClick={onItemClick}
        viewMode={itemMode}
        style={itemStyle}
      />
    ),
    [onItemClick, itemMode, itemStyle]
  )

  const GridListComponent: NonNullable<
    ComponentProps<typeof VirtuosoGrid>["components"]
  >["List"] = useMemo(
    () =>
      forwardRef(({ children, ...props }, ref) => (
        <Stack ref={ref as any} flexWrap="wrap" direction="row" {...props}>
          {children}
        </Stack>
      )),
    []
  )

  const GridItem: NonNullable<
    ComponentProps<typeof VirtuosoGrid>["components"]
  >["Item"] = useMemo(
    () =>
      ({ children, ref, ...props }) => (
        <Box
          display="flex"
          component="div"
          width={`${100 / itemsPerRow}%`}
          flex="none"
          ref={ref as Ref<HTMLDivElement>}
          alignContent="stretch"
          {...props}
        >
          {children}
        </Box>
      ),
    [itemsPerRow]
  )

  if (props.static) {
    return (
      <List disablePadding>
        {data.map((item, index) => (
          <Stack height={itemHeight} key={item}>
            {rowRenderer(index, item)}
          </Stack>
        ))}
      </List>
    )
  }

  return (
    <>
      {itemsPerRow > 1 ? (
        <VirtuosoGrid
          ref={virtuosoRef}
          style={style}
          totalCount={itemsPerRow}
          components={{
            Header: renderHeader,
            Item: GridItem,
            List: GridListComponent
          }}
          data={data}
          itemContent={rowRenderer}
          stateChanged={(state) => {
            onStateChange?.({
              state,
              type: "grid"
            })
          }}
          {...(restoreStateFromFirstValue.current?.type === "grid" && {
            restoreStateFrom: restoreStateFromFirstValue.current.state
          })}
          {...rest}
        />
      ) : (
        <Virtuoso
          ref={virtuosoRef}
          style={style}
          totalCount={itemsPerRow}
          components={{
            Header: renderHeader
          }}
          data={data}
          itemContent={rowRenderer}
          {...(restoreStateFromFirstValue.current?.type === "list" && {
            restoreStateFrom: restoreStateFromFirstValue.current.state
          })}
          onScroll={() => {
            virtuosoRef.current?.getState((state) => {
              onStateChange?.({
                state,
                type: "list"
              })
            })
          }}
          {...rest}
        />
      )}
    </>
  )
})
