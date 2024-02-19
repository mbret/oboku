import { memo } from "react"
import { Typography, Box } from "@mui/material"
import { useRecentlyAddedBooks } from "./helpers"
import { HomeBookList } from "./HomeBookList"

export const RecentlyAddedSection = memo(() => {
  const recentlyAddedBooks = useRecentlyAddedBooks()

  return (
    <>
      {recentlyAddedBooks.length > 0 && (
        <Box>
          <Typography variant="h6" component="h1" padding={1} paddingTop={2}>
            Recently added
          </Typography>
          <HomeBookList data={recentlyAddedBooks} />
        </Box>
      )}
    </>
  )
})
