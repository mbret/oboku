import React, { FC, useEffect, useState } from 'react';
import RcSlider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useRecoilValue } from 'recoil';
import { isComicState, paginationState, manifestState } from './state';

export const Scrubber: FC<{
  onPageChange: (index: number) => void
}> = ({ onPageChange }) => {
  const isComic = useRecoilValue(isComicState)
  const pagination = useRecoilValue(paginationState)
  const manifest = useRecoilValue(manifestState)
  const currentPage = isComic ? pagination?.begin.spineItemIndex : pagination?.begin.pageIndexInChapter
  const totalApproximatePages = isComic ? pagination?.numberOfSpineItems : (pagination?.begin.numberOfPagesInChapter || 1)
  const [value, setValue] = useState(currentPage || 0)
  const max = (totalApproximatePages || 0) - 1
  // const step = !isComic ? 0.01 : 1
  const step = 1

  useEffect(() => {
    setValue(currentPage || 0)
  }, [currentPage, isComic])

  if (totalApproximatePages === 1) {
    return null
  }

  return (
    <RcSlider
      value={value}
      max={max}
      min={0}
      onChange={value => {
        setValue(value)
      }}
      reverse={manifest?.readingDirection === 'rtl'}
      step={step}
      onAfterChange={(value) => {
        console.log(value)
        onPageChange(Math.floor(value))
      }}
    />
  );
}