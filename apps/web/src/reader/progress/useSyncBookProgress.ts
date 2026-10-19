import {
  catchError,
  concatMap,
  EMPTY,
  from,
  map,
  merge,
  Subject,
  share,
} from "rxjs"
import { useEffect } from "react"
import { useIncrementalBookModify } from "../../books"
import { useIsKoreaderSyncDisconnected } from "../../koreader/syncConnection/useIsKoreaderSyncDisconnected"
import { usePushKoreaderPosition } from "../../koreader/syncConnection/usePushKoreaderPosition"
import { useReader } from "../states"
import type { BookChange } from "./bookProgressPatches"
import { observeBookProgressPatches } from "./observeBookProgressPatches"
import { syncBookmarkToKoreader } from "./syncBookmarkToKoreader"

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
  const isKoreaderSyncDisconnected = useIsKoreaderSyncDisconnected()
  const { mutateAsync: pushKoreaderPosition } = usePushKoreaderPosition({
    meta: { suppressGlobalErrorToast: true },
  })

  useEffect(
    function syncBookProgressWhileReading() {
      if (!enabled) return
      if (!reader) return
      if (koreaderDocument === undefined) return

      // Signals that the hook is unmounting. When it emits, the patches
      // complete, which flushes the patches still batched as one last write.
      const unmount$ = new Subject<void>()

      const bookChange$ = observeBookProgressPatches({
        reader,
        koreaderDocument,
        stop$: unmount$,
      }).pipe(
        concatMap(function modifyBook(patch) {
          let change: BookChange | undefined

          return from(
            incrementalBookModify({
              doc: bookId,
              mutationFn: function applyPatchNotingChange(old) {
                // RxDB runs it again on a conflict: the last run is the one written.
                const book = patch(old)
                change = { old, book }

                return book
              },
            }),
          ).pipe(
            map(function toBookChange() {
              return change
            }),
          )
        }),
        catchError(function logSyncError(error) {
          console.error(error)

          return EMPTY
        }),
        share(),
      )

      const koreaderSync$ = bookChange$.pipe(
        syncBookmarkToKoreader({
          isKoreaderSyncDisconnected,
          pushKoreaderPosition,
        }),
      )

      merge(bookChange$, koreaderSync$).subscribe()

      return function flushBookProgressOnUnmount() {
        // Completing the sources rather than unsubscribing lets concatMap
        // run every write still queued, such as the last flush waiting on a
        // finished write in flight. The subscription then ends on its own.
        unmount$.next()
        unmount$.complete()
      }
    },
    [
      reader,
      bookId,
      incrementalBookModify,
      enabled,
      koreaderDocument,
      isKoreaderSyncDisconnected,
      pushKoreaderPosition,
    ],
  )
}
