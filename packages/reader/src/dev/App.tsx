import React from 'react'
import { Reader } from './Reader'
import {
  RecoilRoot,
} from 'recoil'

export const App = () => {
  return (
    <RecoilRoot>
      <Reader />
    </RecoilRoot>
  )
}