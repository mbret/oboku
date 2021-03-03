import { forwardRef, useEffect, useRef } from 'react'
import { useUnmount } from 'react-use'
import { Report } from '../../report'
import { RenditionOptions } from '../types'
import { EpubJSInterface } from './EpubJSInterface'
import { Rendition } from "epubjs"

export const ComicReader = forwardRef<HTMLDivElement, {
  url: Blob | File
  location?: string,
  getRendition: (rendition: Rendition) => void
  epubOptions: RenditionOptions
}>(({ url, location, getRendition, epubOptions }, forwardRef) => {
  const engine = useRef(new EpubJSInterface())
  const getRenditionRef = useRef(getRendition)
  getRenditionRef.current = getRendition

  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    window.engine = engine.current
  }

  useEffect(() => {
    engine.current.load({ url }).catch(Report.error)
    getRenditionRef.current(engine.current.rendition)
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
      if (ref && forwardRef) {
        if (typeof forwardRef === 'function') {
          forwardRef(ref)
        } else {
          forwardRef.current = ref
        }
      }
    }} style={{ height: '100%' }}></div>
  )
})