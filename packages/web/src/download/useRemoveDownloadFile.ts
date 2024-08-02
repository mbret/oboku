import localforage from "localforage"
import { DOWNLOAD_PREFIX } from "../constants.shared"
import { DownloadState, booksDownloadStateSignal } from "./states"
import { useMutation } from "reactjrx"
import { from, tap } from "rxjs"

export const useRemoveDownloadFile = () => {
  return useMutation({
    mutationFn: ({ bookId }: { bookId: string }) =>
      from(localforage.removeItem(`${DOWNLOAD_PREFIX}-${bookId}`)).pipe(
        tap(() => {
          booksDownloadStateSignal.setValue((prev) => ({
            ...prev,
            [bookId]: {
              ...prev[bookId],
              downloadState: DownloadState.None
            }
          }))
        })
      )
  })
}
