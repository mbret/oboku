import type { Manifest } from "@prose-reader/shared"
import { useEffect, useRef } from "react"
import { useSignalValue } from "reactjrx"
import { readerSignal } from "./states"
import { useBook } from "../books/states"

export const useLoadReader = ({
  manifest,
  containerElement,
  bookId,
}: {
  manifest?: Manifest
  containerElement?: HTMLElement | null
  bookId?: string
}) => {
  const reader = useSignalValue(readerSignal)
  const isBookLoadedRef = useRef(false)
  const { data: book } = useBook({ id: bookId })

  useEffect(() => {
    if (
      !isBookLoadedRef.current &&
      reader &&
      manifest &&
      containerElement &&
      book
    ) {
      isBookLoadedRef.current = true

      reader.load({
        containerElement,
        manifest,
        cfi: book.readingStateCurrentBookmarkLocation || undefined,
      })
    }
  }, [manifest, book, containerElement, reader])
}
