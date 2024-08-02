import { signal, useSignalValue } from "reactjrx"

export enum DownloadState {
  None = "none",
  Downloaded = "downloaded",
  Downloading = "downloading"
}

export const booksDownloadStateSignal = signal<
  Record<
    string,
    | {
        downloadState?: DownloadState
        downloadProgress?: number
        size?: number
      }
    | undefined
  >
>({
  key: "bookDownloadsState",
  default: {}
})

/**
 * @deprecated
 */
export const getBookDownloadsState = ({
  bookId,
  normalizedBookDownloadsState
}: {
  bookId: string
  normalizedBookDownloadsState: ReturnType<
    typeof booksDownloadStateSignal.getValue
  >
}) =>
  normalizedBookDownloadsState[bookId] || {
    downloadState: DownloadState.None,
    downloadProgress: 0
  }

export const useBookDownloadState = (bookId?: string | null) => {
  const bookDownloadState = useSignalValue(booksDownloadStateSignal)

  if (!bookId) return undefined

  return {
    downloadState: DownloadState.None,
    downloadProgress: 0,
    isDownloaded:
      bookDownloadState[bookId]?.downloadState === DownloadState.Downloaded,
    isDownloading:
      bookDownloadState[bookId]?.downloadState === DownloadState.Downloading,
    ...bookDownloadState[bookId]
  }
}
