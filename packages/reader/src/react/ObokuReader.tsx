import React, { useEffect, useState } from "react"
import { createReader } from "../reader/reader"
import { Manifest } from "../types"

export const ObokuReader = ({ manifest, onReady, onReader }: {
  manifest?: Manifest,
  onReady?: () => void,
  onReader?: (reader: ReturnType<typeof createReader>) => void
}) => {
  const [reader, setReader] = useState<ReturnType<typeof createReader> | undefined>(undefined)

  useEffect(() => {

  }, [])

  useEffect(() => {
    const readerSubscription$ = reader?.$.subscribe((data) => {
      if (data.event === 'ready') {
        onReady && onReady()
      }
    })

    return () => readerSubscription$?.unsubscribe()
  }, [reader, onReady])

  useEffect(() => {
    if (manifest && reader) {
      reader.load(manifest)
    }
  }, [manifest, reader])

  useEffect(() => {
    return () => reader?.destroy()
  }, [reader])

  return (
    <div 
    id="container" 
    style={{
      width: `100%`,
      height: `100%`
    }}
    ref={ref => {
      if (ref && !reader) {
        const reader = createReader({ containerElement: ref })
        setReader(reader)
        onReader && onReader(reader)
      }
    }} />
  )
}