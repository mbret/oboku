import { memo } from "react"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { Typography, useTheme, Button, Box } from "@mui/material"
import { useNavigate } from "react-router"
import ContinueReadingAsset from "../assets/continue-reading.svg"
import { useContinueReadingBooks } from "../home/helpers"
import { ContinueReadingSection } from "../home/ContinueReadingSection"
import { RecentlyAddedSection } from "../home/RecentlyAddedSection"
import { CommunicationPane } from "../communication/CommunicationPane"
import { ROUTES } from "../navigation/routes"

export const HomeScreen = memo(() => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { data: continueReadingBooks, isPending } = useContinueReadingBooks()

  return (
    <Box display="flex" flex={1} flexDirection="column" overflow="auto">
      <TopBarNavigation
        title={"Home"}
        showBack={false}
        hasSearch
        hasLockLibrary
      />
      <Box pb={2}>
        <CommunicationPane />
        {continueReadingBooks.length === 0 && !isPending && (
          <div
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: theme.spacing(5),
              alignItems: "center",
              display: "flex",
              flexFlow: "column",
            }}
          >
            <img
              src={ContinueReadingAsset}
              alt="img"
              style={{
                width: "100%",
                maxHeight: 300,
                objectFit: "contain",
                paddingBottom: theme.spacing(3),
              }}
            />
            <Typography
              style={{ maxWidth: 300, paddingBottom: theme.spacing(2) }}
              variant="body1"
              align="center"
            >
              Looks like you are not reading anything right now. How about
              starting today ?
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => navigate(ROUTES.LIBRARY_BOOKS, { replace: true })}
            >
              Explore my library
            </Button>
          </div>
        )}
        <ContinueReadingSection />
        <RecentlyAddedSection />
      </Box>
    </Box>
  )
})
