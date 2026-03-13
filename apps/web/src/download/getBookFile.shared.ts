import { Logger } from "../debug/logger.shared"
import { dexieDb } from "../rxdb/dexie"

export const restoreCachedBookFile = ({
  file,
  filename,
}: {
  file: Blob | File
  filename: string
}) =>
  file instanceof File
    ? file
    : new File([file], filename.trim(), {
        type: file.type,
      })

export const getBookFile = async (
  bookId: string,
): Promise<{ data: File } | null> => {
  try {
    const row = await dexieDb.downloads.where("id").equals(bookId).first()

    const file = row?.data

    if (row && file) {
      return {
        data: restoreCachedBookFile({
          file,
          filename: row.filename || bookId,
        }),
      }
    }

    return null
  } catch (e) {
    Logger.error(
      "getBookFile: An error occurred while getting item from storage",
    )
    console.error(e)

    throw e
  }
}
