import React, { useState } from 'react'
import RcSlider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { atom, useRecoilCallback } from 'recoil';
import { Reader } from '../reader';

export const fontsSettingsState = atom({
  key: `fontsSettingsState`,
  default: false
})

export const useToggleFontsSettings = () => useRecoilCallback(({ set }) => () => {
  set(fontsSettingsState, val => !val)
})

export const FontsSettings = ({ reader }: { reader: Reader }) => {
  const toggleFontsSettings = useToggleFontsSettings()
  const [value, setValue] = useState(parseFloat(localStorage.getItem(`fontScale`) || `1`) || 1)
  const max = 5
  const min = 0.1
  const step = 0.1

  return (
    <div style={{
      height: `100%`,
      width: `100%`,
      position: 'absolute',
      left: 0,
      top: 0,
      backgroundColor: 'white'
    }}>
      Font scale
      <RcSlider
        value={value}
        max={max}
        min={min}
        onChange={value => {
          reader.setFontScale(value)
          localStorage.setItem(`fontScale`, value.toString())
          setValue(value)
        }}
        step={step}
      />
      <div style={{
        marginTop: `30px`,

      }}>
        Line height
        <div>
        <button
            onClick={() => {
              reader.setLineHeight(1)
            }}
          >small</button>
          <button
            onClick={() => {
              reader.setLineHeight(`default`)
            }}
          >normal</button>
          <button
            onClick={() => {
              reader.setLineHeight(2)
            }}
          >big</button>
        </div>
      </div>
      <div style={{
        marginTop: `30px`,

      }}>
        Font weight
        <div>
        <button
            onClick={() => {
              reader.setFontWeight(100)
            }}
          >small</button>
          <button
            onClick={() => {
              reader.setLineHeight(`default`)
            }}
          >normal</button>
          <button
            onClick={() => {
              reader.setFontWeight(900)
            }}
          >big</button>
        </div>
      </div>
      <div style={{
        margin: `20px`,
        textAlign: 'center'
      }}>
        <button onClick={toggleFontsSettings}>close</button>
      </div>
    </div>
  )
}