import { useObserve } from "reactjrx"
import { observeStoredDownloads } from "./observeStoredDownloads"

export const useDownloadedFilesInfo = () =>
  useObserve(observeStoredDownloads, [])
