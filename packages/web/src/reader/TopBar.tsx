import { useCallback, useEffect, useState } from 'react'
import { useRecoilValue } from "recoil"
import { isMenuShownState, manifestState, isBookReadyState } from "./states"
import { AppBar, IconButton, Toolbar, Typography, useTheme } from "@material-ui/core"
import { ArrowBackIosRounded, FullscreenExitRounded, FullscreenRounded, ListRounded } from '@material-ui/icons'
import { useNavigation } from '../navigation/useNavigation'
import screenfull, { Screenfull } from 'screenfull'
import { Report } from '../debug/report'
import { useCSS } from '../common/utils'
import { useToggleContentsDialog } from './ContentsDialog'

const screenfullApi = screenfull as Screenfull

export const TopBar = () => {
  const isMenuShow = useRecoilValue(isMenuShownState)
  const isBookReady = useRecoilValue(isBookReadyState)
  const classes = useStyles({ isMenuShow })
  const { goBack } = useNavigation()
  const [isFullScreen, setIsFullScreen] = useState(screenfullApi.isEnabled && screenfullApi.isFullscreen)
  const { title, filename } = useRecoilValue(manifestState) || {}
  const theme = useTheme()
  const toggleContentsDialog = useToggleContentsDialog()

  const onToggleFullScreenClick = useCallback(() => {
    if (screenfullApi.isFullscreen) {
      screenfullApi.exit().catch(Report.error)
    } else if (!screenfullApi.isFullscreen) {
      screenfullApi.request(undefined, { navigationUI: 'hide' }).catch(Report.error)
    }
  }, [])

  useEffect(() => {
    const cb = () => {
      setIsFullScreen(screenfullApi.isFullscreen)
    }

    if (screenfullApi.isEnabled) {
      screenfullApi.on('change', cb)
    }

    return () => {
      if (screenfullApi.isEnabled) {
        screenfullApi.off('change', cb)
      }
    }
  }, [])

  return (
    <AppBar
      position="fixed"
      elevation={0}
      style={classes.appBar}
    >
      <Toolbar style={{ flex: 1 }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={goBack}
        >
          <ArrowBackIosRounded />
        </IconButton>
        <Typography
          variant="body1"
          component="h1"
          color="inherit"
          noWrap style={{ flex: 1, textAlign: 'center', paddingLeft: theme.spacing(2), paddingRight: theme.spacing(2) }}
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
          {screenfullApi.isEnabled && (
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
  return useCSS(() => ({
    appBar: {
      top: 0,
      left: 0,
      width: '100%',
      visibility: isMenuShow ? 'visible' : 'hidden'
    }
  }), [isMenuShow])
}