import {
  catchError,
  concatMap,
  EMPTY,
  filter,
  from,
  map,
  Subject,
  tap,
} from "rxjs"
import { useEffect } from "react"
import { isDefined } from "reactjrx"
import { useIncrementalBookModify } from "../../books"
import { dispatchBookmarkMoved } from "../events"
import { useReader } from "../states"
import { isBookmarkMovedAt } from "./bookProgressPatches"
import { observeBookProgressPatches } from "./observeBookProgressPatches"

const logSyncError = (error: unknown) => {
  console.error(error)

  return EMPTY
}

export const useSyncBookProgress = (
  bookId: string,
  {
    enabled = true,
    koreaderDocument,
  }: {
    enabled?: boolean
    /** The KOReader document of the book's file, `undefined` until the book is loaded. */
    koreaderDocument: string | undefined
  },
) => {
  const reader = useReader()
  const { mutateAsync: incrementalBookModify } = useIncrementalBookModify()

  useEffect(
    function syncBookProgressWhileReading() {
      if (!enabled) return
      if (!reader) return
      if (koreaderDocument === undefined) return

      // Signals that the hook is unmounting. When it emits, the patches
      // complete, which flushes the patches still batched as one last write.
      const unmount$ = new Subject<void>()

      observeBookProgressPatches({ reader, koreaderDocument, stop$: unmount$ })
        .pipe(
          concatMap(function saveBookProgress(patch) {
            const savedAt = new Date().toISOString()

            return from(
              incrementalBookModify({
                doc: bookId,
                mutationFn: function applyPatchAsOfSave(old) {
                  return patch(old, savedAt)
                },
              }),
            ).pipe(
              filter(isDefined),
              map(function toSavedBook(document) {
                return document.toJSON()
              }),
              filter(function isBookmarkMovedBySave(book) {
                return isBookmarkMovedAt(book, savedAt)
              }),
              tap(function dispatchBookmarkMovedBySave() {
                dispatchBookmarkMoved({ bookId, movedAt: savedAt })
              }),
              catchError(logSyncError),
            )
          }),
          catchError(logSyncError),
        )
        .subscribe()

      return function flushBookProgressOnUnmount() {
        // Completing the sources rather than unsubscribing lets concatMap
        // run every write still queued, such as the last flush waiting on a
        // finished write in flight. The subscription then ends on its own.
        unmount$.next()
        unmount$.complete()
      }
    },
    [reader, bookId, incrementalBookModify, enabled, koreaderDocument],
  )
}
