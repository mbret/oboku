import { atom, selector, selectorFamily } from "recoil"

export enum DownloadState {
  None = "none",
  Downloaded = "downloaded",
  Downloading = "downloading"
}

export const normalizedBookDownloadsState = atom<
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

export const bookDownloadsState = selectorFamily({
  key: "bookDownloadsState",
  get:
    (bookId: string) =>
    ({ get }) =>
      get(normalizedBookDownloadsState)[bookId] || {
        downloadState: DownloadState.None,
        downloadProgress: 0
      }
})

export const bookDownloadsSizeState = selector({
  key: "bookDownloadsSizeState",
  get: ({ get }) => {
    const books = Object.values(get(normalizedBookDownloadsState))

    return books
      .filter((book) => book?.downloadState === DownloadState.Downloaded)
      .reduce((size, item) => size + (item?.size || 0), 0)
  }
})
