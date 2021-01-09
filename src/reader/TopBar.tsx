import React, { useCallback, useEffect, useState } from 'react'
import { AppBar, Box, IconButton, makeStyles, Toolbar } from "@material-ui/core"
import { useRecoilValue } from "recoil"
import { isMenuShownState } from "./states"
import { ArrowBackIosRounded, FullscreenExitRounded, FullscreenRounded } from '@material-ui/icons'
import { useNavigation } from '../navigation/useNavigation'
import screenfull, { Screenfull } from 'screenfull'
import { Report } from '../report'

const screenfullApi = screenfull as Screenfull

export const TopBar = () => {
  const isMenuShow = useRecoilValue(isMenuShownState)
  const classes = useStyles({ isMenuShow })
  const { goBack } = useNavigation()
  const [isFullScreen, setIsFullScreen] = useState(screenfullApi.isEnabled && screenfullApi.isFullscreen)

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

    screenfullApi.on('change', cb)

    return () => screenfullApi.off('change', cb)
  }, [])

  return (
    <AppBar
      position="fixed"
      elevation={0}
      className={classes.appBar}
    >
      <Toolbar >
        <IconButton
          edge="start"
          color="inherit"
          onClick={goBack}
        >
          <ArrowBackIosRounded />
        </IconButton>
        <Box flexGrow={1} />
        {screenfullApi.isEnabled && (
          <IconButton
            edge="end"
            color="inherit"
            onClick={onToggleFullScreenClick}
          >
            {isFullScreen ? <FullscreenExitRounded /> : <FullscreenRounded />}
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  )
}

const useStyles = makeStyles(({
  appBar: {
    top: 0,
    left: 0,
    width: '100%',
    visibility: ({ isMenuShow }: { isMenuShow: boolean }) => isMenuShow ? 'visible' : 'hidden'
  }
}))