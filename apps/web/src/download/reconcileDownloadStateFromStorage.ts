import { dexieDb } from "../rxdb/dexie"
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
 * Brings the download state of this tab in line with the files stored on the
 * device. A download in progress in this tab keeps its state: its file is not
 * stored yet.
 */
export const reconcileDownloadStateFromStorage = async () => {
  const storedDownloads = await dexieDb.downloads.toArray()

  booksDownloadStateSignal.update(function mirrorStoredDownloads(state) {
    return reconcileDownloadState(state, storedDownloads)
  })
}
