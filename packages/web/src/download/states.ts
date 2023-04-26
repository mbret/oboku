import { signal, withPersistance } from "reactjrx"
import { selectorFamily } from "recoil"

export enum DownloadState {
  None = "none",
  Downloaded = "downloaded",
  Downloading = "downloading"
}

export const [
  normalizedBookDownloadsStatePersist,
  useNormalizedBookDownloadsState,
  setNormalizedBookDownloadsState,
  getNormalizedBookDownloadsState
] = withPersistance(
  signal<
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
)

/**
 * @deprecated
 */
export const bookDownloadsState = selectorFamily({
  key: "bookDownloadsState",
  get:
    ({
      bookId,
      normalizedBookDownloadsState
    }: {
      bookId: string
      normalizedBookDownloadsState: ReturnType<
        typeof useNormalizedBookDownloadsState
      >
    }) =>
    () =>
      normalizedBookDownloadsState[bookId] || {
        downloadState: DownloadState.None,
        downloadProgress: 0
      }
})

/**
 * @deprecated
 */
export const bookDownloadsSizeState = selectorFamily({
  key: "bookDownloadsSizeState",
  get:
    ({
      normalizedBookDownloadsState
    }: {
      normalizedBookDownloadsState: ReturnType<
        typeof useNormalizedBookDownloadsState
      >
    }) =>
    ({ get }) => {
      const books = Object.values(normalizedBookDownloadsState)

      return books
        .filter((book) => book?.downloadState === DownloadState.Downloaded)
        .reduce((size, item) => size + (item?.size || 0), 0)
    }
})
