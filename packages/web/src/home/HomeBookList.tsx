import { ComponentProps, memo, useMemo } from "react"
import { useTheme } from "@mui/material"
import { BookList } from "../books/bookList/BookList"

export const HomeBookList = memo((props: ComponentProps<typeof BookList>) => {
  const theme = useTheme()
  const adjustedRatioWhichConsiderBottom = theme.custom.coverAverageRatio - 0.1
  const itemWidth = 150
  const listHeight = Math.floor(itemWidth / adjustedRatioWhichConsiderBottom)
  const listStyle = useMemo(
    () => ({
      height: listHeight
    }),
    [listHeight]
  )

  return (
    <BookList
      isHorizontal
      itemWidth={itemWidth}
      style={listStyle}
      viewMode="grid"
      {...props}
    />
  )
})
