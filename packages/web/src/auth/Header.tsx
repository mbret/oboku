import React from 'react';
import { useTheme } from '@material-ui/core';
import { Logo } from '../common/Logo';

export const Header = () => {
  const theme = useTheme()

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      flexFlow: 'row',
      paddingBottom: theme.spacing(4),
    }}>
      <Logo />
    </div>
  );
}