import { useObserve } from "reactjrx"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { switchMap, tap } from "rxjs"
import { useRemoveDownloadFile } from "./useRemoveDownloadFile"
import { retryAndLogError } from "../common/rxjs/operators"

export const useRemoveDownloadWhenBookIsNotInterested = () => {
  const { mutate: removeDownloadFile } = useRemoveDownloadFile()

  useObserve(
    () =>
      latestDatabase$.pipe(
        switchMap((db) => db.book.$),
        tap((changes) => {
          if (
            changes.documentData.isNotInterested &&
            !changes.previousDocumentData?.isNotInterested
          ) {
            removeDownloadFile({ bookId: changes.documentData._id })
          }
        }),
        retryAndLogError()
      ),
    []
  )
}
