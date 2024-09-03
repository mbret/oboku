import { DOWNLOAD_PREFIX } from "../constants.shared"
import { Report } from "../debug/report.shared"
import { dexieDb } from "../rxdb/dexie"

export const getBookFile = async (
  bookId: string
): Promise<{
  name: string
  data: File
} | null> => {
  Report.log(`getBookFile`, `${DOWNLOAD_PREFIX}-${bookId}`)

  try {
    const data = await dexieDb.downloads.where("id").equals(bookId).first()

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
