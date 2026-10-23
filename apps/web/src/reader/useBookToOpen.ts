import type { BookDocType } from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { createBookQueryOptions } from "../books/states"
import { useEnsureQueryData$ } from "../queries/useEnsureQueryData$"

/**
 * The book the reader opens at its bookmark, read once the book may open, so
 * its bookmark holds a position the KOReader position check took from the
 * server. `undefined` until then, and `null` in preview, which opens at the
 * start.
 */
export const useBookToOpen = ({
  bookId,
  isPreview,
  mayOpen,
}: {
  bookId: string
  isPreview: boolean
  mayOpen: boolean
}): DeepReadonly<BookDocType> | null | undefined => {
  const { data: book } = useEnsureQueryData$(
    createBookQueryOptions({ id: isPreview || !mayOpen ? undefined : bookId }),
  )

  if (isPreview) return null

  const isBookMissing = book === null

  if (isBookMissing) return undefined

  return book
}
