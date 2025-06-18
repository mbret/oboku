import type React from "react"
import {
  memo,
  type ReactElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Box, Stack } from "@mui/material"

export const VirtualizedList = memo(
  ({
    data,
    rowRenderer,
    renderHeader,
    itemsPerRow: columnCount,
    style,
  }: {
    data: string[]
    renderHeader?: (() => ReactElement) | (() => React.ReactNode)
    rowRenderer: (index: number, id: string) => ReactElement
    itemsPerRow: number
    style?: React.CSSProperties
  }) => {
    const [, setRender] = useState(() => Symbol())
    const parentRef = useRef<HTMLDivElement>(null)
    const parentOffsetRef = useRef(0)
    const dataCount = renderHeader ? data.length + 1 : data.length
    const rowCount = dataCount / columnCount

    useLayoutEffect(() => {
      parentOffsetRef.current = parentRef.current?.offsetTop ?? 0
    })

    const rowVirtualizer = useVirtualizer({
      count: renderHeader ? rowCount + 1 : rowCount,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 1,
      scrollMargin: parentOffsetRef.current,
      // overscan: 10
    })

    const columnVirtualizer = useVirtualizer({
      horizontal: true,
      count: columnCount,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 200,
    })

    const getColumnWidth = (_index: number) =>
      (parentRef.current?.clientWidth ?? 0) / columnCount

    const items = rowVirtualizer.getVirtualItems()
    const columnItems = columnVirtualizer.getVirtualItems()
    const [before, after] =
      columnItems.length > 0
        ? [
            columnItems[0]?.start,
            columnVirtualizer.getTotalSize() -
              (columnItems[columnItems.length - 1]?.end ?? 0),
          ]
        : [0, 0]

    useEffect(() => {
      // @todo both needed ?
      void rowVirtualizer
      void columnVirtualizer

      if (parentRef.current) {
        const observer = new ResizeObserver(() => {
          setRender(Symbol())
        })

        observer.observe(parentRef.current)

        return () => observer.disconnect()
      }
    }, [rowVirtualizer, columnVirtualizer])
    console.log({ data, items, columnItems, rowCount, columnCount })

    return (
      <Stack
        ref={parentRef}
        style={{
          ...style,
          overflow: "auto",
          contain: "strict",
        }}
        // onScroll={(event) => {
        //   console.log((event.target as HTMLDivElement).scrollTop)
        // }}
      >
        <Box
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {/* <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${items[0]?.start ?? 0}px)`
            }}
          > */}
          {/* {items.map((virtualRow) => (
              <>
                <Box
                  key={virtualRow.index}
                  ref={virtualRow.measureElement}
                  data-index={virtualRow.index}
                  className={
                    virtualRow.index % 2 ? "ListItemOdd" : "ListItemEven"
                  }
                >
                  {virtualRow.index === 0 && renderHeader
                    ? renderHeader()
                    : rowRenderer(
                        virtualRow.index,
                        data[virtualRow.index] ?? ``
                      )}
                </Box>
              </>
            ))} */}
          {rowVirtualizer.getVirtualItems().map((row) => {
            const isHeader = row.index === 0 && !!renderHeader

            return (
              <div
                key={row.key}
                data-index={row.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  //   border: "1px solid red",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  transform: `translateY(${
                    row.start - rowVirtualizer.options.scrollMargin
                  }px)`,
                  display: "flex",
                  ...(isHeader && {
                    flexDirection: "column",
                    width: "100%",
                  }),
                }}
              >
                {isHeader ? (
                  renderHeader()
                ) : (
                  <>
                    <div style={{ width: `${before}px` }} />
                    {columnItems.map((column) => {
                      const rowIndex = renderHeader ? row.index - 1 : row.index
                      const absoluteIndex = rowIndex + (rowIndex + column.index)

                      if (data[absoluteIndex] === undefined) return null

                      return (
                        <div
                          key={column.key}
                          style={{
                            width: getColumnWidth(column.index),
                          }}
                        >
                          {/* {rowRenderer(absoluteIndex, data[absoluteIndex], {
                            size: data.length
                          })} */}
                          {rowRenderer(absoluteIndex, data[absoluteIndex])}
                        </div>
                      )
                    })}
                    <div style={{ width: `${after}px` }} />
                  </>
                )}
              </div>
            )
          })}
          {/* </div> */}
        </Box>
      </Stack>
    )
  },
)
