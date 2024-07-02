import { BookFile } from "./types"
import localforage from "localforage"
import { DOWNLOAD_PREFIX } from "../constants.shared"
import { Report } from "../debug/report.shared"

export const getBookFile = async (
  bookId: string
): Promise<{
  name: string
  data: File
} | null> => {
  Report.log(`getBookFile`, `${DOWNLOAD_PREFIX}-${bookId}`)

  try {
    const data = await localforage.getItem<BookFile>(
      `${DOWNLOAD_PREFIX}-${bookId}`
    )

    const file = data?.data

    if (data && file) {
      return {
        ...data,
        data: !(file instanceof File)
          ? new File([file], data.name, {
              type: file.type
            })
          : file
      }
    }

    return null
  } catch (e) {
    Report.error(
      "getBookFile: An error occurred while getting item from storage"
    )

    throw e
  }
}
