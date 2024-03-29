import React, { useCallback, FC, useMemo, memo } from "react"
import { useTheme } from "@mui/material"
import { useWindowSize } from "react-use"
import { SelectableBookListItem } from "./SelectableBookListItem"
import { useCSS } from "../../common/utils"
import { ReactWindowList } from "../../common/lists/ReactWindowList"

export const SelectableBookList: FC<{
  style?: React.CSSProperties
  data: { id: string; selected: boolean }[]
  onItemClick: (id: { id: string; selected: boolean }) => void
}> = memo((props) => {
  const theme = useTheme()
  const { style, data, onItemClick } = props
  const windowSize = useWindowSize()
  const classes = useStyle({ isHorizontal: false })
  const itemsPerRow = 1
  const adjustedRatioWhichConsiderBottom = theme.custom.coverAverageRatio - 0.1
  const densityMultiplier = 1
  const itemHeight =
    (windowSize.width > theme.breakpoints.values["sm"] ? 200 : 150) *
    theme.custom.coverAverageRatio *
    densityMultiplier

  const rowRenderer = useCallback(
    (item: { id: string; selected: boolean }) => (
      <SelectableBookListItem
        bookId={item.id}
        itemHeight={itemHeight - 4}
        selected={item.selected}
        onItemClick={() => onItemClick(item)}
        paddingBottom={4}
      />
    ),
    [itemHeight, onItemClick]
  )

  const containerStyle = useMemo(
    () => ({ ...classes.container, ...style }),
    [style, classes]
  )

  return (
    <div style={containerStyle}>
      <ReactWindowList
        data={data}
        rowRenderer={rowRenderer}
        itemsPerRow={itemsPerRow}
        preferredRatio={adjustedRatioWhichConsiderBottom}
        layout="vertical"
        itemHeight={itemHeight}
      />
    </div>
  )
})

const useStyle = ({ isHorizontal }: { isHorizontal: boolean }) => {
  const theme = useTheme()

  return useCSS(
    () => ({
      container: {
        display: "flex"
      }
    }),
    [theme, isHorizontal]
  )
}
