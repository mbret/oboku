import { useRemoveDownloadFile } from "./useRemoveDownloadFile"
import { combineLatest, defaultIfEmpty, first, from, switchMap } from "rxjs"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { useMutation$ } from "reactjrx"
import { partitionDownloadedBooks } from "./partitionDownloadedBooks"

export const useRemoveAllDownloadedFiles = () => {
  const { mutateAsync: removeDownloadFile } = useRemoveDownloadFile()

  return useMutation$({
    mutationFn: () =>
      latestDatabase$.pipe(
        first(),
        switchMap((db) => from(partitionDownloadedBooks(db))),
        switchMap(({ removable }) =>
          combineLatest(
            removable.map((book) =>
              from(removeDownloadFile({ bookId: book._id })),
            ),
          ),
        ),
        defaultIfEmpty(null),
      ),
  })
}
