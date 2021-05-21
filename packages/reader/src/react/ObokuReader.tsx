import React, { useEffect, useState } from "react"
import { createReader } from "../reader"
import { Manifest } from "../types"

type LoadOptions = Parameters<ReturnType<typeof createReader>['load']>[1]
type Pagination = ReturnType<ReturnType<typeof createReader>['getPaginationInfo']>

export const ObokuReader = ({ manifest, onReady, onReader, loadOptions, onPaginationChange }: {
  manifest?: Manifest,
  onReady?: () => void,
  onReader?: (reader: ReturnType<typeof createReader>) => void,
  onPaginationChange?: (pagination: Pagination) => void,
  loadOptions?: LoadOptions & {
    cfi?: string
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
    })

    const paginationSubscription = reader?.pagination$.subscribe(data => {
      if (data.event === 'change') {
        onPaginationChange && onPaginationChange(reader.getPaginationInfo())
      }
    })

    return () => {
      readerSubscription$?.unsubscribe()
      paginationSubscription?.unsubscribe()
    }
  }, [reader, onReady])

  useEffect(() => {
    if (manifest && reader) {
      reader.load(manifest, loadOptions, loadOptions?.cfi)
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