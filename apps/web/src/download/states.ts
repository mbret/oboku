import type { QueryClient } from "@tanstack/react-query"
import { useObserve } from "reactjrx"
import {
  findPendingBookDownload,
  usePendingBookDownload,
} from "./downloadBookMutation"
import {
  findStoredFileSize,
  storedDownloadsQueryOptions,
  useStoredDownloads,
} from "./useStoredDownloads"

export enum DownloadState {
  None = "none",
  Downloaded = "downloaded",
  Downloading = "downloading",
}

type BookDownloadState = {
  downloadState: DownloadState
  downloadProgress: number
  size: number | undefined
  isDownloaded: boolean
  isDownloading: boolean
}

/**
 * A download in progress wins over a stored file: the flow downloading the
 * book owns its state until it settles.
 */
const deriveBookDownloadState = ({
  pendingDownloadProgress,
  storedFileSize,
}: {
  pendingDownloadProgress: number | undefined
  storedFileSize: number | undefined
}): BookDownloadState => {
  const isDownloading = pendingDownloadProgress !== undefined
  const isStored = storedFileSize !== undefined

  if (isDownloading) {
    return {
      downloadState: DownloadState.Downloading,
      downloadProgress: pendingDownloadProgress,
      size: undefined,
      isDownloaded: false,
      isDownloading: true,
    }
  }

  if (isStored) {
    return {
      downloadState: DownloadState.Downloaded,
      downloadProgress: 100,
      size: storedFileSize,
      isDownloaded: true,
      isDownloading: false,
    }
  }

  return {
    downloadState: DownloadState.None,
    downloadProgress: 0,
    size: undefined,
    isDownloaded: false,
    isDownloading: false,
  }
}

export const getBookDownloadsState = ({
  bookId,
  queryClient,
}: {
  bookId: string
  queryClient: QueryClient
}) =>
  deriveBookDownloadState({
    pendingDownloadProgress: findPendingBookDownload(
      queryClient,
      bookId,
    )?.progress.getValue(),
    storedFileSize: findStoredFileSize(
      queryClient.getQueryData(storedDownloadsQueryOptions.queryKey),
      bookId,
    ),
  })

export const useBookDownloadState = (bookId?: string | null) => {
  const pendingDownload = usePendingBookDownload(bookId)
  const { data: progress } = useObserve(pendingDownload?.progress)
  const { data: storedFileSize } = useStoredDownloads(
    function selectStoredFileSize(storedDownloads) {
      return findStoredFileSize(storedDownloads, bookId)
    },
  )

  if (!bookId) return undefined

  return deriveBookDownloadState({
    pendingDownloadProgress: pendingDownload ? (progress ?? 0) : undefined,
    storedFileSize,
  })
}
