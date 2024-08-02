import localforage from "localforage"
import { memo, useEffect } from "react"
import { useMutation } from "reactjrx"
import { combineLatest, from, map, of, switchMap } from "rxjs"
import { DOWNLOAD_PREFIX } from "../constants.shared"
import { booksDownloadStateSignal, DownloadState } from "./states"

const getBookKeysFromStorage = async () =>
  (await localforage.keys())
    .filter((key) => key.startsWith(DOWNLOAD_PREFIX))
    .map((key) => ({ key, bookId: key.replace(`${DOWNLOAD_PREFIX}-`, "") }))

export const useRestoreDownloadState = ({
  onSuccess
}: {
  onSuccess: () => void
}) => {
  return useMutation({
    onSuccess,
    mapOperator: "switch",
    mutationFn: () =>
      from(getBookKeysFromStorage()).pipe(
        switchMap((keys) => {
          const items$ = keys.map(({ key, bookId }) =>
            from(localforage.getItem<{ data: Blob }>(key)).pipe(
              map((item) => ({
                item,
                key,
                bookId
              }))
            )
          )

          return combineLatest(items$)
        }),
        switchMap((items) => {
          const state = items.reduce((acc, { bookId, item, key }) => {
            return {
              ...acc,
              [bookId]: {
                downloadProgress: 100,
                downloadState: DownloadState.Downloaded,
                size: item?.data.size
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