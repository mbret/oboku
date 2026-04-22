import { type ComponentProps, memo } from "react"
import { BookList } from "../books/lists"

const listStyle = {
  height: 280,
}

export const HomeBookList = memo(function HomeBookList(
  props: ComponentProps<typeof BookList>,
) {
  return <BookList style={listStyle} viewMode="horizontal" {...props} />
})
