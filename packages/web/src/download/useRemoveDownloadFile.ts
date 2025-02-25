import { useMutation$ } from "reactjrx"
import { dexieDb } from "../rxdb/dexie"
import { DownloadState, booksDownloadStateSignal } from "./states"
import { from, tap } from "rxjs"

export const useRemoveDownloadFile = () => {
  return useMutation$({
    mutationFn: ({ bookId }: { bookId: string }) =>
      from(dexieDb.downloads.delete(bookId)).pipe(
        tap(() => {
          booksDownloadStateSignal.setValue((prev) => ({
            ...prev,
            [bookId]: {
              ...prev[bookId],
              downloadState: DownloadState.None,
            },
          }))
        }),
      ),
  })
}
