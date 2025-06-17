import type { BookDocType } from "@oboku/shared"
import { useMemo } from "react"
import { signal, useSignalValue } from "reactjrx"
import type { DeepReadonlyObject } from "rxdb"

export enum DownloadState {
  None = "none",
  Downloaded = "downloaded",
  Downloading = "downloading",
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
  default: {},
})

const mapBookDownloadState = ({
  bookId,
  bookDownloadState,
}: {
  bookId: string
  bookDownloadState: Record<
    string,
    | {
        downloadState?: DownloadState
        downloadProgress?: number
        size?: number
      }
    | undefined
  >
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
  const bookDownloadState = useSignalValue(booksDownloadStateSignal)

  if (!bookId) return undefined

  return mapBookDownloadState({ bookId, bookDownloadState })
}

export const useBooksDownloadState = (
  bookIds: DeepReadonlyObject<BookDocType>[] = [],
) => {
  const bookDownloadState = useSignalValue(booksDownloadStateSignal)

  return useMemo(
    () =>
      bookIds.reduce(
        (acc, book) => {
          acc[book._id] = mapBookDownloadState({
            bookId: book._id,
            bookDownloadState,
          })

          return acc
        },
        {} as Record<string, ReturnType<typeof mapBookDownloadState>>,
      ),
    [bookDownloadState, bookIds],
  )
}
