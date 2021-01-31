import React, { FC } from 'react'
import { Typography, useTheme } from "@material-ui/core"
import { MenuBookRounded } from '@material-ui/icons';
import { useMeasure } from 'react-use';

export const ReadingProgress: FC<{ style?: React.CSSProperties, progress: number, className: string }> = ({ style, progress, className }) => {
  const theme = useTheme()
  const [ref, layout] = useMeasure()
  let width = 0
  
  if ("width" in layout) {
    width = layout.width
  }

  return (
    <div ref={ref as any} className={className} style={{
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