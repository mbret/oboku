import { AppBar, Box, IconButton, Typography, useTheme } from "@mui/material"
import { PageInformation } from "../PageInformation"
import {
  usePagination,
  readerStateSignal,
  isBookReadyStateSignal,
  isMenuShownStateSignal
} from "../states"
import { Scrubber } from "../Scrubber"
import { DoubleArrowRounded } from "@mui/icons-material"
import { FloatingBottom } from "../FloatingBottom"
import { useSignalValue } from "reactjrx"

export const BottomBar = () => {
  const isMenuShow = useSignalValue(isMenuShownStateSignal)
  const isBookReady = useSignalValue(isBookReadyStateSignal)
  const isLoading = !isBookReady
  const theme = useTheme()
  const reader = useSignalValue(readerStateSignal)
  const { data: pagination } = usePagination()
  // const showScrubber = (totalPages || 1) > 1
  const showScrubber = true

  return (
    <AppBar
      component="div"
      style={{
        bottom: 0,
        top: "auto",
        height: 150,
        // ...layout === 'reflow' && {
        //   height: 200,
        // },
        paddingBottom: 40,
        visibility: isMenuShow ? "visible" : "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignContent: "center",
        position: "fixed"
      }}
    >
      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1
          }}
        >
          <Typography
            style={{ fontWeight: theme.typography.fontWeightMedium }}
            align="center"
          >
            Loading ...
          </Typography>
        </div>
      ) : (
        <>
          <PageInformation style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center"
              // flex: 1
            }}
          >
            <IconButton
              color="inherit"
              style={{ transform: `rotateY(180deg)` }}
              disabled={!pagination?.canGoLeft}
              onClick={(_) => {
                reader?.goToLeftSpineItem()
              }}
              size="large"
            >
              <DoubleArrowRounded />
            </IconButton>
            <div
              style={{
                flex: 1
              }}
            >
              {showScrubber && (
                <Box pl={3} pr={3} display="flex">
                  <Scrubber />
                </Box>
              )}
            </div>
            <IconButton
              color="inherit"
              disabled={!pagination?.canGoRight}
              onClick={(_) => {
                reader?.goToRightSpineItem()
              }}
              size="large"
            >
              <DoubleArrowRounded />
            </IconButton>
          </div>
        </>
      )}
      <FloatingBottom enableProgress enableTime />
    </AppBar>
  )
}
