import { atom, selectorFamily } from "recoil";

export enum DownloadState {
  None = 'none',
  Downloaded = 'downloaded',
  Downloading = 'downloading'
}

export const normalizedBookDownloadsState = atom<Record<string, { downloadState?: DownloadState, downloadProgress?: number } | undefined>>({
  key: 'bookDownloadsState',
  default: {}
})

export const bookDownloadsState = selectorFamily({
  key: 'bookDownloadsState',
  get: (bookId: string) => ({ get }) => get(normalizedBookDownloadsState)[bookId] || {
    downloadState: DownloadState.None,
    downloadProgress: 0,
  }
})