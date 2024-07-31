import { memo } from "react"
import { Typography, useTheme, Box } from "@mui/material"
import { useContinueReadingBooks } from "./helpers"
import { HomeBookList } from "./HomeBookList"

export const ContinueReadingSection = memo(() => {
  const { data: continueReadingBooks } = useContinueReadingBooks()

  return (
    <>
      {continueReadingBooks.length > 0 && (
        <Box>
          <Typography variant="h6" component="h1" padding={1} paddingTop={2}>
            Continue reading
          </Typography>
          <HomeBookList
            data={continueReadingBooks}
            restoreScrollId="homeScreenContinueReadingBookList"
          />
        </Box>
      )}
    </>
  )
})
