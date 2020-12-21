import React from 'react'
import { AppBar, Box, Drawer } from "@material-ui/core"
import { useRecoilState, useRecoilValue } from "recoil"
import { PageNumber } from "./PageNumber"
import { isMenuShownState, currentPageState, totalApproximativePagesState, layoutState } from "./states"
import { Scrubber } from './Scrubber'

export const BottomBar = () => {
  const isMenuShow = useRecoilValue(isMenuShownState)
  const currentPage = useRecoilValue(currentPageState)
  const totalPagesCurrentChapter = useRecoilValue(totalApproximativePagesState)
  const isLoading = currentPage === undefined || totalPagesCurrentChapter === undefined
  const layout = useRecoilValue(layoutState)

  return (
    <AppBar
      // anchor="top"
      // open={isMenuShow}
      // onClose={() => setIsMenuShown(false)}
      // transitionDuration={0}
      position="fixed"
      style={{
        // position: 'absolute',
        bottom: 0,
        top: 'auto',
        height: 100,
        ...layout === 'reflow' && {
          height: 130,
        },
        paddingBottom: 20,
        // paddingTop: 10,
        // height: 90,
        // display: isMenuShow ? 'flex',
        // backgroundColor: 'red',
        visibility: isMenuShow ? 'visible' : 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center'
      }}
    >
      <PageNumber />
      {!isLoading && (
        <Box pl={3} pr={3}>
          <Scrubber />
        </Box>
      )}
    </AppBar>
  )
}