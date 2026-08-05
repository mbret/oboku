import type { DefaultError, UseMutationOptions } from "@tanstack/react-query"
import { useMutation$ } from "reactjrx"
import { dexieDb } from "../rxdb/dexie"
import { DownloadState, booksDownloadStateSignal } from "./states"
import { from, tap } from "rxjs"

type RemoveDownloadFileVariables = { bookId: string }

export const useRemoveDownloadFile = (
  options?: Pick<
    UseMutationOptions<void, DefaultError, RemoveDownloadFileVariables>,
    "meta"
  >,
) => {
  return useMutation$<void, DefaultError, RemoveDownloadFileVariables>({
    ...options,
    mutationFn: function removeDownloadFile({ bookId }) {
      return from(dexieDb.downloads.delete(bookId)).pipe(
        tap(function clearDownloadState() {
          booksDownloadStateSignal.setValue(function markAsNotDownloaded(prev) {
            return {
              ...prev,
              [bookId]: {
                ...prev[bookId],
                downloadState: DownloadState.None,
              },
            }
          })
        }),
      )
    },
  })
}
