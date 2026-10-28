import unzipper from "unzipper"
import type { READER_ACCEPTED_MIME_TYPES } from "@oboku/shared"
import { startsWithRarSignature } from "./openArchive.js"

const containsOpfFile = async (filepath: string) => {
  const directory = await unzipper.Open.file(filepath)

  return directory.files.some((file) => file.path.endsWith(".opf"))
}

export const detectMimeTypeFromContent = async (
  filepath: string,
): Promise<(typeof READER_ACCEPTED_MIME_TYPES)[number] | undefined> => {
  try {
    if (await startsWithRarSignature(filepath)) return "application/vnd.rar"

    return (await containsOpfFile(filepath))
      ? "application/epub+zip"
      : "application/zip"
  } catch (e) {
    console.error(e)
    console.log(
      `Error when trying to detectMimeTypeFromContent with ${filepath}`,
    )

    return undefined
  }
}
