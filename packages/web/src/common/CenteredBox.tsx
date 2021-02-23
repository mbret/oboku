import { Box, useTheme } from '@material-ui/core'
import React, { ComponentProps, FC } from 'react'

export const CenteredBox: FC<{ style: React.CSSProperties } & ComponentProps<typeof Box>> = ({ children, style, ...rest }) => {
  const theme = useTheme()

  return (
    <div {...rest} style={{
      maxWidth: theme.custom.maxWidthCenteredContent,
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      alignSelf: 'center',
      ...style
    }}>
      {children}
    </div>
  )
}