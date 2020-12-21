import React, { FC } from 'react'
import { Box, Typography, useTheme } from '@material-ui/core';
import { currentApproximateProgressState, currentChapterState, currentLocationState, currentPageState, layoutState, totalApproximativePagesState } from './states';
import { useRecoilValue } from 'recoil';

export const PageNumber: FC<{
}> = ({ }) => {
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

  const isLoading = currentApproximateProgress === undefined

  return (
    <Box display="flex" alignItems="center" mb={2}
      style={{
        minHeight: 30,
        ...layout === 'reflow' && {
          minHeight: 60,
        },
        display: 'flex',
        justifyContent: 'center',
      }}>
      {isLoading
        ? (
          <Typography style={{ fontWeight: theme.typography.fontWeightMedium }}>Loading ...</Typography>
        )
        : (
          <>
            {layout === 'fixed'
              ? (
                <Typography style={{ fontWeight: theme.typography.fontWeightMedium }}>page {(currentPageToDisplay || 0)} of {totalPagesToDisplay}</Typography>
              ) : (
                <Box justifyContent="center" alignItems="center" display="flex" flexDirection="column">
                  <Typography variant="body2">
                    {currentChapter?.label}
                  </Typography>
                  <Box display="flex" mt={1}>
                    <Typography >
                      page {(currentPageToDisplay || 0)} of {totalPagesToDisplay}
                    </Typography>
                    <Box ml={2}>
                      <Typography style={{ fontWeight: theme.typography.fontWeightMedium }}>
                        ({displayableProgress} %)
                  </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
          </>
        )
      }
    </Box >
  )
}