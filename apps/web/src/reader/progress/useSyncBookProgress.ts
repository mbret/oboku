import { catchError, concatMap, EMPTY, from, Subject } from "rxjs"
import { useEffect } from "react"
import { useIncrementalBookModify } from "../../books"
import { useReader } from "../states"
import { observeBookProgressPatches } from "./observeBookProgressPatches"

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
          concatMap(function modifyBook(mutationFn) {
            return from(incrementalBookModify({ doc: bookId, mutationFn }))
          }),
          catchError(function logSyncError(error) {
            console.error(error)

            return EMPTY
          }),
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
