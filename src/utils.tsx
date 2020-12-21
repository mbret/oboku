import { useMeasure } from 'react-use'
import React, { useMemo } from 'react'

export const useMeasureElement = (element: React.ReactNode) => {
  const [ref, dim] = useMeasure()

  const elementToRender = useMemo(() => (
    <div ref={ref as any} style={{ position: 'absolute', visibility: 'hidden' }}>
      {element}
    </div>
  ), [element, ref])

  console.log('useMeasureElement')
  return [elementToRender, dim] as [typeof elementToRender, typeof dim]
};

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))