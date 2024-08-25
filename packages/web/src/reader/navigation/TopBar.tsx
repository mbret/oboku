import { memo, useCallback, useEffect, useState } from "react"
import { isMenuShownStateSignal, readerSignal } from "../states"
import {
  AppBar,
  IconButton,
  Toolbar,
  Typography,
  useTheme
} from "@mui/material"
import {
  ArrowBackIosRounded,
  FullscreenExitRounded,
  FullscreenRounded,
  MoreVertRounded
} from "@mui/icons-material"
import { useSafeGoBack } from "../../navigation/useSafeGoBack"
import screenfull from "screenfull"
import { Report } from "../../debug/report.shared"
import { useCSS } from "../../common/utils"
import { useMoreDialog } from "./MoreDialog"
import { useObserve, useSignalValue } from "reactjrx"
import { useShowRemoveBookOnExitDialog } from "./useShowRemoveBookOnExitDialog"

export const TopBar = memo(({ bookId }: { bookId: string }) => {
  const isMenuShow = useSignalValue(isMenuShownStateSignal)
  const reader = useSignalValue(readerSignal)
  const readerState = useObserve(() => reader?.state$, [reader])
  const classes = useStyles({ isMenuShow })
  const { goBack } = useSafeGoBack()
  const [isFullScreen, setIsFullScreen] = useState(
    screenfull.isEnabled && screenfull.isFullscreen
  )
  const { manifest } = useObserve(() => reader?.context.state$, [reader]) || {}
  const { title, filename } = manifest ?? {}
  const theme = useTheme()
  const { toggleMoreDialog } = useMoreDialog()

  const onToggleFullScreenClick = useCallback(() => {
    if (screenfull.isFullscreen) {
      screenfull.exit().catch(Report.error)
    } else if (!screenfull.isFullscreen) {
      screenfull
        .request(undefined, { navigationUI: "hide" })
        .catch(Report.error)
    }
  }, [])

  const { mutate } = useShowRemoveBookOnExitDialog({
    bookId,
    onSettled: () => {
      goBack()
    }
  })

  useEffect(() => {
    const cb = () => {
      setIsFullScreen(screenfull.isFullscreen)
    }

    if (screenfull.isEnabled) {
      screenfull.on("change", cb)
    }

    return () => {
      if (screenfull.isEnabled) {
        screenfull.off("change", cb)
      }
    }
  }, [])

  return (
    <AppBar position="fixed" elevation={0} style={classes.appBar}>
      <Toolbar style={{ flex: 1 }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => {
            mutate()
          }}
          size="large"
        >
          <ArrowBackIosRounded />
        </IconButton>
        <Typography
          variant="body1"
          component="h1"
          color="inherit"
          noWrap
          style={{
            flex: 1,
            textAlign: "center",
            paddingLeft: theme.spacing(2),
            paddingRight: theme.spacing(2)
          }}
        >
          {title || filename}
        </Typography>
        <div>
          <IconButton
            color="inherit"
            disabled={readerState === "idle"}
            onClick={toggleMoreDialog}
            size="large"
          >
            <MoreVertRounded />
          </IconButton>
          {screenfull.isEnabled && (
            <IconButton
              edge="end"
              color="inherit"
              onClick={onToggleFullScreenClick}
              size="large"
            >
              {isFullScreen ? <FullscreenExitRounded /> : <FullscreenRounded />}
            </IconButton>
          )}
        </div>
      </Toolbar>
    </AppBar>
  )
})

const useStyles = ({ isMenuShow }: { isMenuShow: boolean }) => {
  return useCSS(
    () => ({
      appBar: {
        top: 0,
        left: 0,
        width: "100%",
        visibility: isMenuShow ? "visible" : "hidden"
      }
    }),
    [isMenuShow]
  )
}
