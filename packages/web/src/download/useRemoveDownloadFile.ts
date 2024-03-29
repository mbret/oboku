import localforage from "localforage"
import { DOWNLOAD_PREFIX } from "../constants.shared"
import { Report } from "../debug/report.shared"
import { DownloadState, booksDownloadStateSignal } from "./states"

export const useRemoveDownloadFile = () => {
  return async (bookId: string) => {
    try {
      await localforage.removeItem(`${DOWNLOAD_PREFIX}-${bookId}`)

      booksDownloadStateSignal.setValue((prev) => ({
        ...prev,
        [bookId]: {
          ...prev[bookId],
          downloadState: DownloadState.None
        }
      }))
    } catch (e) {
      Report.error(e)
    }
  }
}
