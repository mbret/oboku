import React from 'react'
import { AppBar, Box, Typography, useTheme } from "@material-ui/core"
import { useRecoilValue } from "recoil"
import { PageNumber } from "./PageNumber"
import { isMenuShownState, currentPageState, totalApproximativePagesState, layoutState } from "./states"
import { Scrubber } from './Scrubber'
import { useTime } from '../common/useTime'

export const BottomBar = () => {
  const isMenuShow = useRecoilValue(isMenuShownState)
  const currentPage = useRecoilValue(currentPageState)
  const totalPagesCurrentChapter = useRecoilValue(totalApproximativePagesState)
  const isLoading = currentPage === undefined || totalPagesCurrentChapter === undefined
  const layout = useRecoilValue(layoutState)
  const theme = useTheme()
  const time = useTime()

  return (
    <AppBar
      component="div"
      style={{
        bottom: 0,
        top: 'auto',
        height: 110,
        ...layout === 'reflow' && {
          height: 130,
        },
        paddingBottom: 20,
        visibility: isMenuShow ? 'visible' : 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignContent: 'center',
        position: 'fixed',
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
      <div style={{ position: 'absolute', bottom: theme.spacing(1), left: theme.spacing(1) }}>
        <Typography variant="caption">{time.toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' })}</Typography>
      </div>
    </AppBar>
  )
}