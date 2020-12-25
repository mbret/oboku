import React, { FC } from 'react'
import { Typography, useTheme } from "@material-ui/core"
import { MenuBookRounded } from '@material-ui/icons';
import { useMeasure } from 'react-use';

export const ReadingProgress: FC<{ style: React.CSSProperties, progress: number }> = ({ style, progress }) => {
  const theme = useTheme()
  const [ref, { width }] = useMeasure()

  return (
    <div ref={ref as any} style={{
      width: '100%',
      textAlign: 'center',
      ...style,
    }}>
      <MenuBookRounded style={{ opacity: '50%', fontSize: width * 0.4 }} />
      <Typography
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          textShadow: '0px 0px 3px black',
          fontSize: width * 0.12,
          fontWeight: theme.typography.fontWeightBold,
        }}>{Math.floor(progress) || 1}%</Typography>
    </div>
  )
}