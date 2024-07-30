import React, {
  useCallback,
  FC,
  memo,
  ComponentProps,
  useRef,
  forwardRef,
  useMemo,
  Ref,
  useEffect,
  useState
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
  VirtuosoGridHandle,
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
  const virtuosoGridRef = useRef<VirtuosoGridHandle>(null)
  const windowSize = useWindowSize()
  const [isReadyToBeShown, setIsReadyToBeShown] = useState(false)
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

  useEffect(() => {
    setTimeout(() => {
      if (restoreStateFromFirstValue.current?.type === "grid") {
        virtuosoGridRef.current?.scrollTo({
          behavior: "instant",
          left: 0,
          top: restoreStateFromFirstValue.current.state.scrollTop
        })
      }
      setIsReadyToBeShown(true)
    }, 10)
  }, [])

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
          ref={virtuosoGridRef}
          style={{
            ...style,
            visibility: isReadyToBeShown ? undefined : "hidden"
          }}
          totalCount={itemsPerRow}
          components={{
            Header: renderHeader,
            Item: GridItem,
            List: GridListComponent
          }}
          data={data}
          itemContent={rowRenderer}
          onScroll={(event) => {
            onStateChange?.({
              state: {
                gap: { column: 0, row: 0 },
                item: { height: 0, width: 0 },
                viewport: { height: 0, width: 0 },
                scrollTop: (event.target as HTMLDivElement).scrollTop
              },
              type: "grid"
            })
          }}
          // stateChanged={(state) => {
          //   onStateChange?.({
          //     state,
          //     type: "grid"
          //   })
          // }}
          // {...(restoreStateFromFirstValue.current?.type === "grid" && {
          //   restoreStateFrom: restoreStateFromFirstValue.current.state
          // })}
          {...rest}
        />
      ) : (
        <Virtuoso
          ref={virtuosoRef}
          style={{
            ...style,
            visibility: isReadyToBeShown ? undefined : "hidden"
          }}
          totalCount={itemsPerRow}
          components={{
            Header: renderHeader
          }}
          data={data}
          itemContent={rowRenderer}
          // {...(restoreStateFromFirstValue.current?.type === "list" && {
          //   restoreStateFrom: restoreStateFromFirstValue.current.state
          // })}
          {...(restoreStateFromFirstValue.current?.type === "list" && {
            initialScrollTop: restoreStateFromFirstValue.current.state.scrollTop
          })}
          onScroll={(event) => {
            virtuosoRef.current?.getState((state) => {
              onStateChange?.({
                state: {
                  ranges: [],
                  scrollTop: (event.target as HTMLDivElement).scrollTop
                },
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
