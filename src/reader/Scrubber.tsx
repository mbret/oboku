import React, { FC, useEffect, useState } from 'react';
import RcSlider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useRecoilValue } from 'recoil';
import { currentPageState, layoutState, totalApproximativePagesState, currentApproximateProgressState } from './states';
import { useTheme } from '@material-ui/core';
import { useReader } from './ReaderProvider';

export const Scrubber: FC<{

}> = () => {
  const currentPage = useRecoilValue(currentPageState)
  const totalApproximativePages = useRecoilValue(totalApproximativePagesState)
  const currentApproximateProgress = useRecoilValue(currentApproximateProgressState)
  const [value, setValue] = useState(currentPage || 0)
  const layout = useRecoilValue(layoutState)
  const theme = useTheme()
  const reader = useReader()
  const max = layout === 'reflow' ? 1 : (totalApproximativePages || 0) - 1
  const step = layout === 'reflow' ? 0.01 : 1

  useEffect(() => {
    if (layout === 'fixed') {
      setValue(currentPage || 0)
    }
  }, [currentPage, layout])

  useEffect(() => {
    if (layout === 'reflow') {
      setValue(currentApproximateProgress || 0)
    }
  }, [currentApproximateProgress, layout])

  return (
    <RcSlider
      value={value}
      max={max}
      min={0}
      onChange={value => {
        setValue(value)
      }}
      step={step}
      onAfterChange={(value) => {
        if (layout === 'fixed') {
          reader?.goToPage(value)
        } else {
          reader?.goToPageByBookPercentage(value)
        }
      }}
      railStyle={{
        backgroundColor: theme.palette.grey['800'],
        height: 5,
      }}
      trackStyle={{
        backgroundColor: theme.palette.grey['100'],
        height: 5,
      }}
      handleStyle={{
        backgroundColor: theme.palette.primary.light,
        border: `2px solid white`,
        width: 25,
        height: 25,
        marginTop: -10,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.14), 0px 3px 4px rgba(0, 0, 0, 0.12), 0px 1px 5px rgba(0, 0, 0, 0.2)',
      }}
    />
  );
}