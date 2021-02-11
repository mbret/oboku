import { FC, useEffect, useRef } from 'react'
import { useUnmount } from 'react-use'
import { Report } from '../../report'
import { RenditionOptions } from '../types'
import { EpubJSInterface } from './EpubJSInterface'

export const ComicReader: FC<{
  url: Blob | File
  location?: string,
  getRendition: (rendition: any) => void
  epubOptions: RenditionOptions
}> = ({ url, location, getRendition, epubOptions }) => {
  const engine = useRef(new EpubJSInterface())
  const getRenditionRef = useRef(getRendition)
  getRenditionRef.current = getRendition

  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    window.engine = engine.current
  }

  useEffect(() => {
    engine.current.load({ url }).catch(Report.error)
    getRenditionRef.current(engine.current)
  }, [url, getRendition])

  useEffect(() => {
    engine.current.display(location)
  }, [location])

  useUnmount(() => {
    engine.current.destroy()
  })

  return (
    <div ref={ref => {
      ref && engine.current.renderTo(ref, epubOptions)
    }} style={{ height: '100%' }}></div>
  )
}