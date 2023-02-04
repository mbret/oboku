import { BookFile } from "./types"
import localforage from "localforage"
import { DOWNLOAD_PREFIX } from "../constants.shared"
import { Report } from "../debug/report.shared"

export const getBookFile = (bookId: string) => {
  Report.log(`getBookFile`, `${DOWNLOAD_PREFIX}-${bookId}`)

  try {
    return localforage.getItem<BookFile>(`${DOWNLOAD_PREFIX}-${bookId}`)
  } catch (e) {
    Report.error(
      "getBookFile: An error occurred while getting item from storage"
    )

    throw e
  }
}
