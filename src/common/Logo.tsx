import { Typography, useTheme } from '@material-ui/core'
import React from 'react'

export const Logo = () => {
  const theme = useTheme()

  return (
    <div style={{flexFlow: 'row', display: 'flex'}}>
      <Typography variant="h1" color="primary" style={{
        fontWeight: theme.typography.fontWeightBold,
      }}>O</Typography>
      <Typography variant="h1" style={{
        display: 'flex',
        fontWeight: theme.typography.fontWeightBold,
        flexFlow: 'row',
      }}>
        boku
      </Typography>
    </div>
  )
}