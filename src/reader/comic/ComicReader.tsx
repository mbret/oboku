import React, { FC, useEffect, useRef } from 'react'
import { Report } from '../../report'
import { EpubJSInterface } from './EpubJSInterface'

export const ComicReader: FC<{
  url: Blob
  location?: string,
  getRendition: (rendition: EpubJSInterface) => void
}> = ({ url, location, getRendition }) => {
  const engine = useRef(new EpubJSInterface())
  const getRenditionRef = useRef(getRendition)
  getRenditionRef.current = getRendition

  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    window.engine = engine.current
  }

  useEffect(() => {
    engine.current.load({
      url,
    }).catch(Report.error)
    getRenditionRef.current(engine.current)
  }, [url, getRendition])

  useEffect(() => {
    engine.current.display(location)
  }, [location])

  return (
    <div ref={ref => {
      ref && engine.current.renderTo(ref)
    }} style={{ height: '100%' }}></div>
  )
}