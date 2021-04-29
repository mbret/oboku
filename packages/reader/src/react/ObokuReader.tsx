import React, { useEffect, useState } from "react"
import { createReader } from "../reader/reader"
import { Manifest } from "../types"

type LoadOptions = Parameters<ReturnType<typeof createReader>['load']>[1]
type Pagination = ReturnType<ReturnType<typeof createReader>['getPagination']>

export const ObokuReader = ({ manifest, onReady, onReader, loadOptions, onPaginationChange }: {
  manifest?: Manifest,
  onReady?: () => void,
  onReader?: (reader: ReturnType<typeof createReader>) => void,
  onPaginationChange?: (pagination: Pagination) => void,
  loadOptions?: LoadOptions & {
    spineIndexOrIdOrCfi?: string | number
  }
}) => {
  const [reader, setReader] = useState<ReturnType<typeof createReader> | undefined>(undefined)

  useEffect(() => {

  }, [])

  useEffect(() => {
    const readerSubscription$ = reader?.$.subscribe((data) => {
      if (data.event === 'ready') {
        onReady && onReady()
      }
      if (data.event === 'paginationChange') {
        onPaginationChange && onPaginationChange(reader.getPagination())
      }
    })

    return () => readerSubscription$?.unsubscribe()
  }, [reader, onReady])

  useEffect(() => {
    if (manifest && reader) {
      reader.load(manifest, loadOptions, loadOptions?.spineIndexOrIdOrCfi)
    }
  }, [manifest, reader, loadOptions])

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