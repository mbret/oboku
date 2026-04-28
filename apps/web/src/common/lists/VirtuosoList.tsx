import type React from "react"
import {
  memo,
  useRef,
  forwardRef,
  useMemo,
  type Ref,
  type ReactElement,
  type ComponentProps,
  useImperativeHandle,
  useCallback,
  useEffect,
} from "react"
import { Box, Stack, styled } from "@mui/material"
import {
  type Components,
  type ContextProp,
  type GridItemProps,
  type GridListProps,
  type ListProps,
  type StateCallback,
  Virtuoso,
  VirtuosoGrid,
  type VirtuosoGridHandle,
  type VirtuosoHandle,
} from "react-virtuoso"
import { useLiveRef } from "reactjrx"
import { useRestoreVirtuosoScroll } from "./useRestoreVirtuosoScroll"
import styles from "./VirtuosoList.module.css"

type Context = { size: number }

const GridStack = styled(Stack)({
  flexWrap: "wrap",
})

const GridItemBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "itemsPerRow",
})<{ itemsPerRow: number }>(({ itemsPerRow }) => ({
  display: "flex",
  width: `${100 / itemsPerRow}%`,
  flex: "none",
  alignContent: "stretch",
}))

type SharedProps = ComponentProps<typeof Virtuoso> &
  ComponentProps<typeof VirtuosoGrid>

export type VirtuosoGridListHandle = {
  scrollTo: VirtuosoGridHandle["scrollTo"]
  isGrid: boolean
}

export const VirtuosoList = memo(
  ({
    renderHeader,
    itemsPerRow = 1,
    style,
    className,
    listElementStyle,
    data = [],
    rowRenderer,
    restoreScrollId,
    horizontalDirection,
    ref,
    onScroll,
    ...rest
  }: {
    renderHeader?: () => React.ReactNode | ReactElement
    style?: React.CSSProperties
    className?: string
    listElementStyle?: React.CSSProperties
    data?: string[]
    itemsPerRow?: number
    restoreScrollId?: string
    rowRenderer?: (
      rowIndex: number,
      item: string,
      context: Context,
    ) => React.ReactNode
    horizontalDirection?: boolean
    onScroll?: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void
    ref?: React.RefObject<VirtuosoGridListHandle | null>
  } & Pick<
    SharedProps,
    "scrollerRef" | "customScrollParent" | "useWindowScroll"
  >) => {
    const virtuosoRef = useRef<VirtuosoHandle>(null)
    const virtuosoGridRef = useRef<VirtuosoGridHandle>(null)
    const _ref = useRef<VirtuosoGridListHandle>(null)
    const finalRef = ref ?? _ref
    const {
      restoreScrollState,
      saveScrollState,
      restoreStateFromFirstValue,
      isRestored,
      resetScrollState,
    } = useRestoreVirtuosoScroll({
      restoreScrollId,
      virtuosoRef: finalRef,
    })
    const onScrollRef = useLiveRef(onScroll)

    const GridListComponent = useMemo(
      () =>
        forwardRef<HTMLDivElement, GridListProps & ContextProp<Context>>(
          ({ children, style, ...props }, ref) => {
            const _ref = ref

            return (
              <GridStack
                ref={_ref}
                direction="row"
                style={{ ...style, ...listElementStyle }}
                {...props}
              >
                {children}
              </GridStack>
            )
          },
        ),
      [listElementStyle],
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
          <GridItemBox
            ref={ref as Ref<HTMLDivElement>}
            {...props}
            itemsPerRow={itemsPerRow}
          >
            {children}
          </GridItemBox>
        ),
      [itemsPerRow],
    )

    const size = data.length
    const context = useMemo(() => ({ size }), [size])
    const isGrid = itemsPerRow > 1
    const isGridRef = useLiveRef(isGrid)
    const gridStyle = useMemo(
      (): React.CSSProperties => ({
        ...style,
        scrollbarWidth: "initial",
      }),
      [style],
    )
    const gridComponents = useMemo(
      () => ({
        Header: renderHeader,
        Item: GridItem,
        List: GridListComponent,
      }),
      [renderHeader, GridItem, GridListComponent],
    )

    const ListComponent = useMemo(
      () =>
        ({ style, ...props }: ListProps & ContextProp<Context>) => {
          return <Box style={{ ...style, ...listElementStyle }} {...props} />
        },
      [listElementStyle],
    )

    const listComponents = useMemo(
      (): Components<string, Context> => ({
        Header: renderHeader,
        List: ListComponent,
      }),
      [renderHeader, ListComponent],
    )

    const _onScroll = useCallback(
      (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
        saveScrollState(event)
        onScrollRef.current?.(event)
      },
      [saveScrollState, onScrollRef],
    )

    const onReadyStateChanged = useCallback(
      (ready: boolean) => {
        if (ready && !isRestored) {
          restoreScrollState()
        }
      },
      [restoreScrollState, isRestored],
    )

    useImperativeHandle(finalRef, () => ({
      scrollTo: (location: ScrollToOptions) => {
        if (isGridRef.current) {
          virtuosoGridRef.current?.scrollTo(location)
        } else {
          virtuosoRef.current?.scrollTo(location)
        }
      },
      getState: (stateCb: StateCallback) =>
        virtuosoRef.current?.getState(stateCb),
      get isGrid() {
        return isGridRef.current
      },
    }))

    useEffect(
      function resetScrollStateOnTypeChange() {
        void isGrid

        resetScrollState()
      },
      [isGrid, resetScrollState],
    )

    // When scrolling horizontally, opt Virtuoso's inner viewport element into
    // being a size query container so items can resolve `100cqb` against the
    // usable block size (excluding the scrollbar). See VirtuosoList.module.css.
    const scrollerClassName =
      [horizontalDirection ? styles.horizontalCarousel : undefined, className]
        .filter(Boolean)
        .join(" ") || undefined

    return (
      <>
        {isGrid ? (
          <VirtuosoGrid<string, Context>
            ref={virtuosoGridRef}
            style={gridStyle}
            className={className}
            totalCount={data.length}
            components={gridComponents}
            data={data}
            itemContent={rowRenderer}
            context={context}
            readyStateChanged={onReadyStateChanged}
            onScroll={_onScroll}
            {...rest}
          />
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            style={style}
            className={scrollerClassName}
            totalCount={data.length}
            components={listComponents}
            context={context}
            data={data}
            horizontalDirection={horizontalDirection}
            itemContent={rowRenderer}
            onScroll={_onScroll}
            {...(restoreStateFromFirstValue?.type === "list" && {
              initialScrollTop: restoreStateFromFirstValue.state.scrollTop,
            })}
            {...rest}
          />
        )}
      </>
    )
  },
)
