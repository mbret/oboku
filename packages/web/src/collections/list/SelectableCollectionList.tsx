import React, { useCallback, FC, useMemo, memo } from "react"
import { useTheme } from "@mui/material"
import { useCSS } from "../../common/utils"
import { ReactWindowList } from "../../common/lists/ReactWindowList"
import { SelectableCollectionListItem } from "./SelectableCollectionListItem"

export const SelectableCollectionList: FC<{
  renderHeader?: () => React.ReactNode
  style?: React.CSSProperties
  data: { id: string; selected: boolean }[]
  onItemClick: (id: { id: string; selected: boolean }) => void
}> = memo((props) => {
  const { renderHeader, style, data, onItemClick } = props
  const classes = useStyle()

  const rowRenderer = useCallback(
    ({ id, selected }: (typeof data)[number]) => (
      <SelectableCollectionListItem
        id={id}
        onItemClick={() => onItemClick({ id, selected })}
        selected={selected}
      />
    ),
    [onItemClick]
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
        itemsPerRow={1}
        renderHeader={renderHeader}
        itemHeight={60}
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
