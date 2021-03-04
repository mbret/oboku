import React from 'react'
import { AppBar, Box, Typography, useTheme } from "@material-ui/core"
import { useRecoilValue } from "recoil"
import { PageInformation } from "./PageInformation"
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
        height: 130,
        ...layout === 'reflow' && {
          // height: 200,
        },
        paddingBottom: 40,
        visibility: isMenuShow ? 'visible' : 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignContent: 'center',
        position: 'fixed',
      }}
    >
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Typography style={{ fontWeight: theme.typography.fontWeightMedium }} align="center">Loading ...</Typography>
        </div>
      ) : (
          <>
            <PageInformation style={{ flex: 1 }} />
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