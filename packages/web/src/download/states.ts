import { signal } from "reactjrx"

export enum DownloadState {
  None = "none",
  Downloaded = "downloaded",
  Downloading = "downloading"
}

export const normalizedBookDownloadsStateSignal = signal<
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

export const normalizedBookDownloadsStatePersist =
  normalizedBookDownloadsStateSignal

/**
 * @deprecated
 */
export const getBookDownloadsState = ({
  bookId,
  normalizedBookDownloadsState
}: {
  bookId: string
  normalizedBookDownloadsState: ReturnType<
    typeof normalizedBookDownloadsStateSignal.getValue
  >
}) =>
  normalizedBookDownloadsState[bookId] || {
    downloadState: DownloadState.None,
    downloadProgress: 0
  }