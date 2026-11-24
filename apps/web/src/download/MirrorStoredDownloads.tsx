import { memo, useEffect, useEffectEvent } from "react"
import { catchError, EMPTY, filter, tap } from "rxjs"
import { reportErrors } from "../common/rxjs/operators"
import { notifyError } from "../notifications/toasts"
import { observeStoredDownloads } from "./observeStoredDownloads"
import {
  type BooksDownloadState,
  booksDownloadStateSignal,
  DownloadState,
} from "./states"

type StoredDownload = { id: string; data: Blob }

const reconcileDownloadState = (
  state: BooksDownloadState,
  storedDownloads: readonly StoredDownload[],
): BooksDownloadState => {
  const storedBookIds = new Set(storedDownloads.map(({ id }) => id))

  const removedDownloadsState = Object.fromEntries(
    Object.entries(state)
      .filter(function isRemovedFromStorage([bookId, bookDownloadState]) {
        return (
          bookDownloadState?.downloadState === DownloadState.Downloaded &&
          !storedBookIds.has(bookId)
        )
      })
      .map(function markAsNotDownloaded([bookId, bookDownloadState]) {
        return [
          bookId,
          { ...bookDownloadState, downloadState: DownloadState.None },
        ]
      }),
  )

  const storedDownloadsState = Object.fromEntries(
    storedDownloads
      .filter(function isNotDownloadingInThisTab({ id }) {
        return state[id]?.downloadState !== DownloadState.Downloading
      })
      .map(function markAsDownloaded({ id, data }) {
        return [
          id,
          {
            downloadProgress: 100,
            downloadState: DownloadState.Downloaded,
            size: data.size,
          },
        ]
      }),
  )

  return { ...state, ...removedDownloadsState, ...storedDownloadsState }
}

/**
 * Keeps the download state in line with the stored downloads, including the
 * writes of other tabs. A download in progress in this tab keeps its state.
 * `onReady` runs once, after the first read.
 */
export const MirrorStoredDownloads = memo(function MirrorStoredDownloads({
  onReady,
}: {
  onReady: () => void
}) {
  const reportReady = useEffectEvent(onReady)

  useEffect(function mirrorStoredDownloadsWhileMounted() {
    const subscription = observeStoredDownloads()
      .pipe(
        tap(function mirrorStoredDownloads(storedDownloads) {
          booksDownloadStateSignal.update(
            function reconcileWithStoredDownloads(state) {
              return reconcileDownloadState(state, storedDownloads)
            },
          )
        }),
        filter(function isFirstRead(_storedDownloads, index) {
          return index === 0
        }),
        tap(function reportFirstReadMirrored() {
          reportReady()
        }),
        reportErrors,
        catchError(function notifyAndStopMirroring(error) {
          notifyError(error)

          return EMPTY
        }),
      )
      .subscribe()

    return function stopMirroringOnUnmount() {
      subscription.unsubscribe()
    }
  }, [])

  return null
})
