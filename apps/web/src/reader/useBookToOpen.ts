import type { BookDocType } from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { createBookQueryOptions } from "../books/states"
import type { KoreaderPositionCheck } from "../koreader/syncConnection/useKoreaderPositionCheck"
import { useEnsureQueryData$ } from "../queries/useEnsureQueryData$"

/**
 * The book the reader opens at its bookmark, read once the KOReader position
 * check is done, so its bookmark holds a position the check took from the
 * server. `undefined` until then, and `null` in preview, which opens at the
 * start.
 */
export const useBookToOpen = ({
  bookId,
  isPreview,
  koreaderPositionCheck,
}: {
  bookId: string
  isPreview: boolean
  koreaderPositionCheck: KoreaderPositionCheck
}): DeepReadonly<BookDocType> | null | undefined => {
  const isKoreaderPositionChecked = koreaderPositionCheck.status === "done"
  const { data: book } = useEnsureQueryData$(
    createBookQueryOptions({
      id: isPreview || !isKoreaderPositionChecked ? undefined : bookId,
    }),
  )

  if (isPreview) return null

  const isBookMissing = book === null

  if (isBookMissing) return undefined

  return book
}
