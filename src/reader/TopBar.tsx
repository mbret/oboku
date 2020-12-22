import React, { useEffect } from 'react'
import { AppBar, Box, Drawer, IconButton, Toolbar, Typography, useTheme } from "@material-ui/core"
import { useRecoilState } from "recoil"
import { isMenuShownState } from "./states"
import { useHistory } from 'react-router-dom'
import { ArrowBackIosRounded } from '@material-ui/icons'

export const TopBar = () => {
  const [isMenuShow, setIsMenuShown] = useRecoilState(isMenuShownState)
  const history = useHistory()
  const theme = useTheme()

  return (
    <AppBar
      // anchor="top"
      // open={isMenuShow}
      // onClose={() => setIsMenuShown(false)}
      // transitionDuration={0}
      position="fixed"
      elevation={0}
      style={{
        // position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        // backgroundColor: theme.palette.primary.main,
        // display: isMenuShow ? 'flex'
        visibility: isMenuShow ? 'visible' : 'hidden'
      }}
    >
      <Toolbar >
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => {
            history.goBack()
          }}
        >
          <ArrowBackIosRounded />
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}