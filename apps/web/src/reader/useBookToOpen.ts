import type { BookDocType } from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { createBookQueryOptions } from "../books/states"
import type { KoreaderPositionCheck } from "../koreader/syncConnection/useKoreaderPositionCheck"
import { useEnsureQueryData$ } from "../queries/useEnsureQueryData$"

/**
 * The book the reader opens at its bookmark, `undefined` until the book may
 * open: the book as the KOReader position check saved it when it took the
 * server's position, otherwise the book as stored when the reader opened.
 * `undefined` in preview, which opens at the start.
 */
export const useBookToOpen = ({
  bookId,
  isPreview,
  koreaderPositionCheck,
}: {
  bookId: string
  isPreview: boolean
  koreaderPositionCheck: KoreaderPositionCheck
}): DeepReadonly<BookDocType> | undefined => {
  const { data: storedBook } = useEnsureQueryData$(
    createBookQueryOptions({ id: isPreview ? undefined : bookId }),
  )
  const isKoreaderPositionChecked = koreaderPositionCheck.status === "done"

  if (!isKoreaderPositionChecked) return undefined

  return koreaderPositionCheck.updatedBook ?? storedBook ?? undefined
}
