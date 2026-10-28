import type { BookDocType } from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { createBookQueryOptions } from "../books/states"
import { useEnsureQueryData$ } from "../queries/useEnsureQueryData$"

/**
 * The book the reader opens at its bookmark, read from the database once the
 * book may open, so its bookmark holds a position the KOReader position check
 * took from the server. `undefined` until then, and `null` in preview, which
 * opens at the start.
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
  const { queryKey, queryFn } = createBookQueryOptions({
    id: isPreview || !mayOpen ? undefined : bookId,
  })
  const { data: book } = useEnsureQueryData$({
    // Its own key, so the book is read from the database: the live book
    // query's cache can still hold the book from before the check's write.
    queryKey: [...queryKey, "toOpen"],
    queryFn,
  })

  if (isPreview) return null

  const isBookMissing = book === null

  if (isBookMissing) return undefined

  return book
}
