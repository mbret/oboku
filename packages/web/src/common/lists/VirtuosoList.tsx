import React, {
  memo,
  useRef,
  forwardRef,
  useMemo,
  Ref,
  useEffect,
  useState
} from "react"
import { Box, Stack } from "@mui/material"
import {
  GridItemProps,
  GridListProps,
  GridStateSnapshot,
  StateSnapshot,
  Virtuoso,
  VirtuosoGrid,
  VirtuosoGridHandle,
  VirtuosoHandle
} from "react-virtuoso"
import { signal, useSignalValue } from "reactjrx"

type Context = { size: number }

const restoreScrollSignal = signal<
  Record<
    string,
    | { type: "list"; state: StateSnapshot }
    | { type: "grid"; state: GridStateSnapshot }
  >
>({
  key: "restoreScrollSignal",
  default: {}
})

export const VirtuosoList = memo(
  ({
    renderHeader,
    itemsPerRow = 1,
    style,
    data = [],
    rowRenderer,
    onStateChange,
    restoreStateFrom,
    restoreScrollId,
    horizontalDirection,
    ...rest
  }: {
    renderHeader?: () => React.ReactNode | JSX.Element
    style?: React.CSSProperties
    data?: string[]
    itemsPerRow?: number
    restoreScrollId?: string
    rowRenderer?: (
      rowIndex: number,
      item: string,
      context: Context
    ) => React.ReactNode
    horizontalDirection?: boolean
    onStateChange?: (
      state:
        | { type: "list"; state: StateSnapshot }
        | { type: "grid"; state: GridStateSnapshot }
    ) => void
    restoreStateFrom?:
      | { type: "list"; state: StateSnapshot }
      | { type: "grid"; state: GridStateSnapshot }
  }) => {
    const virtuosoRef = useRef<VirtuosoHandle>(null)
    const virtuosoGridRef = useRef<VirtuosoGridHandle>(null)
    const [isReadyToBeShown, setIsReadyToBeShown] = useState(false)
    const restoreScrollState = useSignalValue(restoreScrollSignal, (state) =>
      restoreScrollId ? state[restoreScrollId] : undefined
    )
    const restoreStateFromFirstValue = useRef(restoreScrollState)

    const GridListComponent = useMemo(
      () =>
        forwardRef<
          any,
          GridListProps & {
            context?: Context
          }
        >(({ children, ...props }, ref) => (
          <Stack ref={ref as any} flexWrap="wrap" direction="row" {...props}>
            {children}
          </Stack>
        )),
      []
    )

    const GridItem = useMemo(
      () =>
        ({
          children,
          ref,
          ...props
        }: GridItemProps & {
          context?: Context
        }) => (
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

    const size = data.length
    const context = useMemo(() => ({ size }), [size])

    return (
      <>
        {itemsPerRow > 1 ? (
          <VirtuosoGrid
            ref={virtuosoGridRef}
            className="withScrollBar"
            style={{
              ...style,
              visibility: isReadyToBeShown ? undefined : "hidden",
              scrollbarWidth: "initial"
            }}
            totalCount={data.length}
            components={{
              Header: renderHeader,
              Item: GridItem,
              List: GridListComponent
            }}
            data={data}
            itemContent={rowRenderer}
            context={context}
            onScroll={(event) => {
              if (restoreScrollId !== undefined) {
                restoreScrollSignal.setValue((state) => ({
                  ...state,
                  [restoreScrollId]: {
                    state: {
                      gap: { column: 0, row: 0 },
                      item: { height: 0, width: 0 },
                      viewport: { height: 0, width: 0 },
                      scrollTop: (event.target as HTMLDivElement).scrollTop
                    },
                    type: "grid"
                  }
                }))
              }
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
            context={context}
            data={data}
            horizontalDirection={horizontalDirection}
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
                if (restoreScrollId !== undefined) {
                  restoreScrollSignal.setValue((state) => ({
                    ...state,
                    [restoreScrollId]: {
                      state: {
                        ranges: [],
                        scrollTop: (event.target as HTMLDivElement).scrollTop
                      },
                      type: "list"
                    }
                  }))
                }
              })
            }}
            {...rest}
          />
        )}
      </>
    )
  }
)