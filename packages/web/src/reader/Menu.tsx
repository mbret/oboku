import { Backdrop, CircularProgress } from '@material-ui/core'
import React from 'react'
import { useRecoilState } from 'recoil'
import { BottomBar } from './BottomBar'
import { isMenuShownState } from './states'
import { TopBar } from './TopBar'

export const Menu = () => {
  const [isMenuShow, setIsMenuShown] = useRecoilState(isMenuShownState)
  
  return (
    <>
      <Backdrop open={isMenuShow} onClick={() => setIsMenuShown(false)}>
        <CircularProgress color="inherit" />
      </Backdrop>
      {/* <TopBar />
      <BottomBar /> */}
    </>
  )
}