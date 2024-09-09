import { memo, useEffect } from "react"
import { useMutation } from "reactjrx"
import { from, of, switchMap } from "rxjs"
import { booksDownloadStateSignal, DownloadState } from "./states"
import { dexieDb } from "../rxdb/dexie"

const useRestoreDownloadState = ({
  onSuccess
}: {
  onSuccess: () => void
}) => {
  return useMutation({
    onSuccess,
    mapOperator: "switch",
    mutationFn: () =>
      from(dexieDb.downloads.toArray()).pipe(
        switchMap((items) => {
          const state = items.reduce((acc, { id: bookId, name, data }) => {
            return {
              ...acc,
              [bookId]: {
                downloadProgress: 100,
                downloadState: DownloadState.Downloaded,
                size: data.size
              }
            }
          }, {})

          booksDownloadStateSignal.setValue(state)

          return of(null)
        })
      )
  })
}

export const RestoreDownloadState = memo(
  ({ onReady }: { onReady: () => void }) => {
    const { mutate: restoreDownloadState } = useRestoreDownloadState({
      onSuccess: onReady
    })

    useEffect(() => {
      restoreDownloadState()
    }, [restoreDownloadState])

    return null
  }
)
