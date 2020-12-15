import { Box, useTheme } from '@material-ui/core'
import React, { FC } from 'react'

export const CenteredBox: FC<{ style: React.CSSProperties }> = ({ children, style }) => {
  const theme = useTheme()

  return (
    <Box style={{
      maxWidth: theme.custom.maxWidthCenteredContent,
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      alignSelf: 'center',
      ...style
    }}>
      {children}
    </Box>
  )
}