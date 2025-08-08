import { memo } from "react"
import { Typography, Box } from "@mui/material"
import { HomeBookList } from "./HomeBookList"
import { useRecentlyAddedBooks } from "./useRecentlyAddedBooks"

export const RecentlyAddedSection = memo(() => {
  const recentlyAddedBooks = useRecentlyAddedBooks()

  return (
    <>
      {recentlyAddedBooks.length > 0 && (
        <Box>
          <Typography variant="h6" component="h1" padding={1} paddingTop={2}>
            Recently added
          </Typography>
          <HomeBookList
            data={recentlyAddedBooks}
            restoreScrollId="homeScreenRecentlyAddedBookList"
          />
        </Box>
      )}
    </>
  )
})
