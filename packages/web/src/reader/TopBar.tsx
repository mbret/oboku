import React, { useCallback, useEffect, useState } from 'react'
import { useRecoilValue } from "recoil"
import { isMenuShownState } from "./states"
import { AppBar, IconButton, Toolbar } from "@material-ui/core"
import { ArrowBackIosRounded, FullscreenExitRounded, FullscreenRounded } from '@material-ui/icons'
import { useNavigation } from '../navigation/useNavigation'
import screenfull, { Screenfull } from 'screenfull'
import { Report } from '../report'
import { useCSS } from '../common/utils'

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
      style={classes.appBar}
    >
      <Toolbar >
        <IconButton
          edge="start"
          color="inherit"
          onClick={goBack}
        >
          <ArrowBackIosRounded />
        </IconButton>
        <div style={{ flexGrow: 1 }} />
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