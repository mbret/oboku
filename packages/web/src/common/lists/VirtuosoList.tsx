import React, {
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
import { Box, Stack } from "@mui/material"
import {
  GridStateSnapshot,
  StateSnapshot,
  Virtuoso,
  VirtuosoGrid,
  VirtuosoGridHandle,
  VirtuosoHandle
} from "react-virtuoso"

export const VirtuosoList: FC<{
  renderHeader?: () => React.ReactNode
  style?: React.CSSProperties
  data: string[]
  itemsPerRow: number
  rowRenderer: (rowIndex: number, item: string) => React.ReactNode
  onStateChange?: (
    state:
      | { type: "list"; state: StateSnapshot }
      | { type: "grid"; state: GridStateSnapshot }
  ) => void
  restoreStateFrom?:
    | { type: "list"; state: StateSnapshot }
    | { type: "grid"; state: GridStateSnapshot }
}> = memo(
  ({
    renderHeader,
    itemsPerRow,
    style,
    data,
    rowRenderer,
    onStateChange,
    restoreStateFrom,
    ...rest
  }) => {
    const virtuosoRef = useRef<VirtuosoHandle>(null)
    const virtuosoGridRef = useRef<VirtuosoGridHandle>(null)
    const [isReadyToBeShown, setIsReadyToBeShown] = useState(false)
    const restoreStateFromFirstValue = useRef(restoreStateFrom)

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

    return (
      <>
        {itemsPerRow > 1 ? (
          <VirtuosoGrid
            ref={virtuosoGridRef}
            style={{
              ...style,
              visibility: isReadyToBeShown ? undefined : "hidden"
            }}
            totalCount={data.length}
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
            totalCount={data.length}
            components={{
              Header: renderHeader
            }}
            data={data}
            itemContent={rowRenderer}
            // {...(restoreStateFromFirstValue.current?.type === "list" && {
            //   restoreStateFrom: restoreStateFromFirstValue.current.state
            // })}
            {...(restoreStateFromFirstValue.current?.type === "list" && {
              initialScrollTop:
                restoreStateFromFirstValue.current.state.scrollTop
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
  }
)
