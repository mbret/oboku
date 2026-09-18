import fs from "node:fs"
import unzipper from "unzipper"
import type { READER_ACCEPTED_MIME_TYPES } from "@oboku/shared"

export const detectMimeTypeFromContent = async (
  filepath: string,
): Promise<(typeof READER_ACCEPTED_MIME_TYPES)[number] | undefined> => {
  let mimeType: (typeof READER_ACCEPTED_MIME_TYPES)[number] | undefined
  try {
    await fs
      .createReadStream(filepath)
      .pipe(unzipper.Parse())
      .on("entry", (entry) => {
        if (!mimeType && entry.path.endsWith(".opf")) {
          mimeType = "application/epub+zip"
        }

        entry.autodrain()
      })
      .promise()
  } catch (e) {
    console.error(e)
    console.log(
      `Error when trying to detectMimeTypeFromContent with ${filepath}`,
    )
  }

  return mimeType
}
