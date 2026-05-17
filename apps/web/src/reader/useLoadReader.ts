import type { Manifest } from "@prose-reader/shared"
import { useEffect, useRef } from "react"
import { useSignalValue } from "reactjrx"
import { readerSignal } from "./states"
import { useBook } from "../books/states"

export const useLoadReader = ({
  manifest,
  containerElement,
  bookId,
  isPreview,
}: {
  manifest?: Manifest
  containerElement?: HTMLElement | null
  bookId?: string
  isPreview: boolean
}) => {
  const reader = useSignalValue(readerSignal)
  const isBookLoadedRef = useRef(false)
  const { data: book } = useBook({
    id: bookId,
    enabled: (query) => {
      if (isPreview) return false

      const hasNoResultYet = query.state.data === undefined

      return hasNoResultYet
    },
  })

  useEffect(() => {
    if (
      !isBookLoadedRef.current &&
      reader &&
      manifest &&
      containerElement &&
      (isPreview || book)
    ) {
      isBookLoadedRef.current = true
      const cfi = isPreview
        ? undefined
        : book?.readingStateCurrentBookmarkLocation || undefined

      reader.load({
        containerElement,
        manifest,
        ...(cfi ? { cfi } : {}),
      })
    }
  }, [manifest, book, containerElement, reader, isPreview])
}
