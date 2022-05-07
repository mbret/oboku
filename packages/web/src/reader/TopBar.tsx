import { useCallback, useEffect, useState } from "react"
import { useRecoilValue } from "recoil"
import { isMenuShownState, manifestState, isBookReadyState } from "./states"
import {
  AppBar,
  IconButton,
  Toolbar,
  Typography,
  useTheme
} from "@material-ui/core"
import {
  ArrowBackIosRounded,
  FullscreenExitRounded,
  FullscreenRounded,
  ListRounded
} from "@material-ui/icons"
import { useSafeGoBack } from "../navigation/useSafeGoBack"
import screenfull from "screenfull"
import { Report } from "../debug/report.shared"
import { useCSS } from "../common/utils"
import { useToggleContentsDialog } from "./ContentsDialog"

export const TopBar = () => {
  const isMenuShow = useRecoilValue(isMenuShownState)
  const isBookReady = useRecoilValue(isBookReadyState)
  const classes = useStyles({ isMenuShow })
  const { goBack } = useSafeGoBack()
  const [isFullScreen, setIsFullScreen] = useState(
    screenfull.isEnabled && screenfull.isFullscreen
  )
  const { title, filename } = useRecoilValue(manifestState) || {}
  const theme = useTheme()
  const toggleContentsDialog = useToggleContentsDialog()

  const onToggleFullScreenClick = useCallback(() => {
    if (screenfull.isFullscreen) {
      screenfull.exit().catch(Report.error)
    } else if (!screenfull.isFullscreen) {
      screenfull
        .request(undefined, { navigationUI: "hide" })
        .catch(Report.error)
    }
  }, [])

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
        <IconButton edge="start" color="inherit" onClick={goBack}>
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
            disabled={!isBookReady}
            onClick={toggleContentsDialog}
          >
            <ListRounded />
          </IconButton>
          {screenfull.isEnabled && (
            <IconButton
              edge="end"
              color="inherit"
              onClick={onToggleFullScreenClick}
            >
              {isFullScreen ? <FullscreenExitRounded /> : <FullscreenRounded />}
            </IconButton>
          )}
        </div>
      </Toolbar>
    </AppBar>
  )
}

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
