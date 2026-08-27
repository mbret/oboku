import { isShallowEqual } from "@oboku/shared"
import { useCallback } from "react"
import { signal, useSignalValue } from "reactjrx"

export enum DownloadState {
  None = "none",
  Downloaded = "downloaded",
  Downloading = "downloading",
}

export type BooksDownloadState = Record<
  string,
  | {
      downloadState?: DownloadState
      downloadProgress?: number
      size?: number
    }
  | undefined
>

export const booksDownloadStateSignal = signal<BooksDownloadState>({
  key: "bookDownloadsState",
  default: {},
})

const mapBookDownloadState = ({
  bookId,
  bookDownloadState,
}: {
  bookId: string
  bookDownloadState: BooksDownloadState
}) => {
  return {
    downloadState: DownloadState.None,
    downloadProgress: 0,
    isDownloaded:
      bookDownloadState[bookId]?.downloadState === DownloadState.Downloaded,
    isDownloading:
      bookDownloadState[bookId]?.downloadState === DownloadState.Downloading,
    ...bookDownloadState[bookId],
  }
}

export const getBookDownloadsState = ({ bookId }: { bookId: string }) => {
  const bookDownloadState = booksDownloadStateSignal.getValue()

  return mapBookDownloadState({ bookId, bookDownloadState })
}

export const useBookDownloadState = (bookId?: string | null) => {
  const selectBookDownloadState = useCallback(
    function selectBookDownloadState(bookDownloadState: BooksDownloadState) {
      return bookId
        ? mapBookDownloadState({ bookId, bookDownloadState })
        : undefined
    },
    [bookId],
  )

  return useSignalValue(
    booksDownloadStateSignal,
    selectBookDownloadState,
    isShallowEqual,
  )
}
