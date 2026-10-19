import type { BookDocType } from "@oboku/shared"
import { catchError, concatMap, EMPTY, from, Subject, tap } from "rxjs"
import { useEffect } from "react"
import { useIncrementalBookModify } from "../../books"
import { recordBookmarkWriteForKoreader } from "../../koreader/syncConnection/koreaderPositionsToPush"
import { useActiveProfileId } from "../../profiles/active/activeProfileId"
import { useReader } from "../states"
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
  const activeProfileId = useActiveProfileId()
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
          concatMap(function modifyBook(patch) {
            let written: { old: BookDocType; book: BookDocType } | undefined

            return from(
              incrementalBookModify({
                doc: bookId,
                mutationFn: function applyPatchNotingBooks(old) {
                  // RxDB runs it again on a conflict: the last run is the one written.
                  const book = patch(old)
                  written = { old, book }

                  return book
                },
              }),
            ).pipe(
              tap(function recordBookmarkForKoreader() {
                if (!written || !activeProfileId) return

                recordBookmarkWriteForKoreader({
                  profileId: activeProfileId,
                  ...written,
                })
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
    [
      reader,
      bookId,
      incrementalBookModify,
      enabled,
      koreaderDocument,
      activeProfileId,
    ],
  )
}
