import React, { FC } from 'react'
import { Box, Typography, useTheme } from '@material-ui/core';
import { currentApproximateProgressState, currentChapterState, currentLocationState, currentPageState, layoutState, totalApproximativePagesState } from './states';
import { useRecoilValue } from 'recoil';

export const PageInformation: FC<{
  style: React.CSSProperties
}> = ({style}) => {
  const theme = useTheme()
  const currentPage = useRecoilValue(currentPageState)
  const totalApproximativePages = useRecoilValue(totalApproximativePagesState)
  const layout = useRecoilValue(layoutState)
  const currentApproximateProgress = useRecoilValue(currentApproximateProgressState)
  const roundedProgress = Math.floor((currentApproximateProgress || 0) * 100)
  const displayableProgress = roundedProgress > 0 ? roundedProgress : 1
  const currentChapter = useRecoilValue(currentChapterState)
  const currentLocation = useRecoilValue(currentLocationState)
  const currentPageInChapter = currentLocation?.start.displayed.page
  const totalPagesCurrentChapter = currentLocation?.start.displayed.total
  const currentPageToDisplay = layout === 'fixed' ? ((currentPage || 0) + 1) : currentPageInChapter
  const totalPagesToDisplay = layout === 'fixed' ? totalApproximativePages : totalPagesCurrentChapter

  return (
    <div
      style={{
        ...style,
        // minHeight: 30,
        ...layout === 'reflow' && {
          // minHeight: 50,
        },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <>
        {layout === 'fixed'
          ? (
            <Typography style={{ fontWeight: theme.typography.fontWeightMedium }}>page {(currentPageToDisplay || 0)} of {totalPagesToDisplay}</Typography>
          ) : (
            <div style={{ width: '100%', justifyContent: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" noWrap style={{ width: '90%', textAlign: 'center' }}>
                {currentChapter?.label}
              </Typography>
              <div style={{ display: 'flex', marginTop: theme.spacing(1) }}>
                <Typography >
                  page {(currentPageToDisplay || 0)} of {totalPagesToDisplay}
                </Typography>
                {currentApproximateProgress !== undefined && (
                  <div style={{ marginLeft: theme.spacing(2) }}>
                    <Typography style={{ fontWeight: theme.typography.fontWeightMedium }}>
                      ({displayableProgress} %)
                    </Typography>
                  </div>
                )}
              </div>
            </div>
          )}
      </>
    </div>
  )
}