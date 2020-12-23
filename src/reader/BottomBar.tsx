import React from 'react'
import { AppBar, Box, Typography, useTheme } from "@material-ui/core"
import { useRecoilValue } from "recoil"
import { PageNumber } from "./PageNumber"
import { isMenuShownState, currentPageState, totalApproximativePagesState, layoutState } from "./states"
import { Scrubber } from './Scrubber'

export const BottomBar = () => {
  const isMenuShow = useRecoilValue(isMenuShownState)
  const currentPage = useRecoilValue(currentPageState)
  const totalPagesCurrentChapter = useRecoilValue(totalApproximativePagesState)
  console.log('updateProgress', currentPage, totalPagesCurrentChapter)
  const isLoading = currentPage === undefined || totalPagesCurrentChapter === undefined
  const layout = useRecoilValue(layoutState)
  const theme = useTheme()
  
  return (
    <AppBar
      position="fixed"
      style={{
        bottom: 0,
        top: 'auto',
        height: 100,
        ...layout === 'reflow' && {
          height: 130,
        },
        paddingBottom: 20,
        visibility: isMenuShow ? 'visible' : 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center',
      }}
    >
      {isLoading ? (
        <Typography style={{ fontWeight: theme.typography.fontWeightMedium }} align="center">Loading ...</Typography>
      ) : (
          <>
            <PageNumber />
            <Box pl={3} pr={3} display="flex">
              <Scrubber />
            </Box>
          </>
        )}
    </AppBar>
  )
}