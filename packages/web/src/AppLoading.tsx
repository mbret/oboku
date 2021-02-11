import { Box } from '@material-ui/core';
import React from 'react'
import { Logo } from './common/Logo';

export const AppLoading = () => {
  return (
    <Box height="100%" display="flex" justifyContent="center" alignItems="center" alignContent="center">
      <Logo />
    </Box>
  )
}