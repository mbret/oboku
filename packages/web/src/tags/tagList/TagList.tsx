import React, { useCallback, FC, useMemo, memo } from "react"
import { useTheme } from "@mui/material"
import { useCSS } from "../../common/utils"
import { ReactWindowList } from "../../lists/ReactWindowList"
import { TagListItemList } from "./TagListItemList"
import { TagsDocType } from "@oboku/shared"

export const TagList: FC<{
  renderHeader?: () => React.ReactNode
  headerHeight?: number
  style?: React.CSSProperties
  data: string[]
  onItemClick?: (tag: { _id: string }) => void
}> = memo((props) => {
  const { renderHeader, headerHeight, style, data, onItemClick } = props
  const classes = useStyle()

  const rowRenderer = useCallback(
    (item: string) => <TagListItemList id={item} onItemClick={onItemClick} />,
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
        headerHeight={headerHeight}
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
