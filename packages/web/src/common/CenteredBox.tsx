import { useTheme } from '@material-ui/core'
import React, { FC } from 'react'

export const CenteredBox: FC<{ style: React.CSSProperties }> = ({ children, style, ...rest }) => {
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