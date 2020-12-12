import React from 'react'
import { Logo } from './common/Logo';

export const AppLoading = () => {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignContent: 'center',
      alignItems: 'center'
    }}>
      <Logo />
    </div>
  )
}