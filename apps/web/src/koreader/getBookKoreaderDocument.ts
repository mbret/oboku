import { getKoreaderFileDigest } from "@prose-reader/koreader"
import { getBookFile } from "../download/getBookFile.shared"
import { StreamerFileNotFoundError } from "../errors/errors.shared"

/**
 * The `document` a KOReader sync server files the book's positions under, for
 * the file this device has: its digest as KOReader computes it by default
 * ("Binary" document matching). Throws when the book is not downloaded here,
 * as the reader's streamer does.
 */
export const getBookKoreaderDocument = async (bookId: string) => {
  const file = await getBookFile(bookId)

  if (!file) throw new StreamerFileNotFoundError(`FileNotFoundError`)

  return getKoreaderFileDigest(file.data)
}
