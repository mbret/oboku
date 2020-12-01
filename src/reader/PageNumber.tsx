import React, { FC } from 'react'
import { Typography, useTheme } from '@material-ui/core';

export const PageNumber: FC<{
  currentPage: number | undefined,
  totalPages: number | undefined,
  isReflow: boolean | undefined
}> = ({ currentPage, totalPages, isReflow }) => {
  const theme = useTheme()

  return (
    <div style={{
      margin: theme.spacing(2),
      textAlign: 'center',
      display: 'flex',
      flexFlow: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {currentPage && totalPages && (
        <>
          <Typography variant="body2">page {isReflow ? '~' : ''}{currentPage} of {totalPages}</Typography>
        </>
      )}
    </div>
  )
}