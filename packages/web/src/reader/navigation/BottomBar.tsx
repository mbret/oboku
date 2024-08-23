import { AppBar, Box, IconButton, Typography, useTheme } from "@mui/material"
import { PageInformation } from "../PageInformation"
import { readerSignal, isMenuShownStateSignal } from "../states"
import { Scrubber } from "./Scrubber"
import { DoubleArrowRounded } from "@mui/icons-material"
import { FloatingBottom } from "./FloatingBottom"
import { useObserve, useSignalValue } from "reactjrx"
import { useLocalSettings } from "../../settings/states"

export const BottomBar = () => {
  const isMenuShow = useSignalValue(isMenuShownStateSignal)
  const reader = useSignalValue(readerSignal)
  const readerState = useObserve(() => reader?.state$, [reader])
  const theme = useTheme()
  const navigation = useObserve(() => reader?.navigation.state$, [reader])
  const showScrubber = true
  const { useOptimizedTheme } = useLocalSettings()

  return (
    <AppBar
      component="div"
      position="fixed"
      sx={{
        bottom: 0,
        top: "auto",
        height: "150px",
        paddingBottom: "40px",
        ...(useOptimizedTheme && {
          borderTop: "1px solid black"
        }),
        visibility: isMenuShow ? "visible" : "hidden"
      }}
    >
      {readerState === "idle" ? (
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
            }}
          >
            <IconButton
              color="inherit"
              style={{ transform: `rotateY(180deg)` }}
              disabled={!navigation?.canGoLeftSpineItem}
              onClick={(_) => {
                reader?.navigation.goToLeftSpineItem()
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
              disabled={!navigation?.canGoRightSpineItem}
              onClick={(_) => {
                reader?.navigation.goToRightSpineItem()
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
