import { type ComponentProps, memo, useMemo } from "react"
import { BookList } from "../books/bookList/BookList"

export const HomeBookList = memo((props: ComponentProps<typeof BookList>) => {
  const listStyle = useMemo(
    () => ({
      height: 280,
    }),
    [],
  )

  return <BookList style={listStyle} viewMode="horizontal" {...props} />
})
