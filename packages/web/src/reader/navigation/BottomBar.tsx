import {
  AppBar,
  Box,
  IconButton,
  Stack,
  Typography,
  useTheme
} from "@mui/material"
import { PageInformation } from "./PageInformation"
import { readerSignal, isMenuShownStateSignal } from "../states"
import { Scrubber } from "./Scrubber"
import { DoubleArrowRounded } from "@mui/icons-material"
import { FloatingBottom } from "./FloatingBottom"
import { useObserve, useSignalValue } from "reactjrx"
import { useLocalSettings } from "../../settings/states"
import { memo } from "react"

export const BottomBar = memo(({ bookId }: { bookId: string }) => {
  const isMenuShow = useSignalValue(isMenuShownStateSignal)
  const reader = useSignalValue(readerSignal)
  const readerState = useObserve(() => reader?.state$, [reader])
  const theme = useTheme()
  const navigation = useObserve(() => reader?.navigation.state$, [reader])
  const showScrubber = true
  const { useOptimizedTheme } = useLocalSettings()
  const settings = useObserve(() => reader?.settings.values$, [reader])
  const readingDirection = settings?.computedPageTurnDirection

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
        visibility: isMenuShow ? "visible" : "hidden",
        alignItems: "center"
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
        <Stack flex={1} pt={1} gap={0} maxWidth={620} width="100%">
          <PageInformation flex={1} bookId={bookId} />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center"
            }}
          >
            <IconButton
              color="inherit"
              style={{
                transform:
                  readingDirection === "vertical"
                    ? `rotate(-90deg)`
                    : `rotateY(180deg)`
              }}
              disabled={
                !navigation?.canGoLeftSpineItem &&
                !navigation?.canGoTopSpineItem
              }
              onClick={(_) => {
                reader?.navigation.goToLeftOrTopSpineItem()
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
                  <Scrubber bookId={bookId} />
                </Box>
              )}
            </div>
            <IconButton
              color="inherit"
              style={{
                transform:
                  readingDirection === "vertical" ? `rotate(90deg)` : undefined
              }}
              disabled={
                !navigation?.canGoRightSpineItem &&
                !navigation?.canGoBottomSpineItem
              }
              onClick={(_) => {
                reader?.navigation.goToRightOrBottomSpineItem()
              }}
              size="large"
            >
              <DoubleArrowRounded />
            </IconButton>
          </div>
        </Stack>
      )}
      <FloatingBottom enableProgress enableTime />
    </AppBar>
  )
})
