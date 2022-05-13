import {
  AppBar,
  Box,
  IconButton,
  Typography,
  useTheme
} from "@mui/material"
import { useRecoilValue } from "recoil"
import { PageInformation } from "./PageInformation"
import {
  isMenuShownState,
  isBookReadyState,
  hasRightSpineItemState,
  hasLeftSpineItemState
} from "./states"
import { Scrubber } from "./Scrubber"
import { useTime } from "../common/useTime"
import { DoubleArrowRounded } from "@mui/icons-material"
import { useReader } from "./ReaderProvider"

export const BottomBar = () => {
  const isMenuShow = useRecoilValue(isMenuShownState)
  const isBookReady = useRecoilValue(isBookReadyState)
  const isLoading = !isBookReady
  const hasRightSpineItem = useRecoilValue(hasRightSpineItemState)
  const hasLeftSpineItem = useRecoilValue(hasLeftSpineItemState)
  const theme = useTheme()
  const time = useTime()
  const reader = useReader()
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
              disabled={!hasLeftSpineItem}
              onClick={(_) => {
                reader?.goToLeftSpineItem()
              }}
              size="large">
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
              disabled={!hasRightSpineItem}
              onClick={(_) => {
                reader?.goToRightSpineItem()
              }}
              size="large">
              <DoubleArrowRounded />
            </IconButton>
          </div>
        </>
      )}
      <div
        style={{
          position: "absolute",
          bottom: theme.spacing(1),
          left: theme.spacing(1)
        }}
      >
        <Typography variant="caption">
          {time.toLocaleTimeString(navigator.language, {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </Typography>
      </div>
    </AppBar>
  );
}
