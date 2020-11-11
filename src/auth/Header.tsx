import React from 'react';
import { Typography, useTheme } from '@material-ui/core';

export const Header = () => {
  const theme = useTheme()

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      flexFlow: 'row',
      paddingTop: theme.spacing(5),
      paddingBottom: theme.spacing(5),
    }}>
      <Typography variant="h1" color="primary" style={{
        fontWeight: theme.typography.fontWeightBold,
      }}>O</Typography>
      <Typography variant="h1"  style={{
        display: 'flex',
        fontWeight: theme.typography.fontWeightBold,
        flexFlow: 'row',
      }}>
        boku
        </Typography>
    </div>
  );
}