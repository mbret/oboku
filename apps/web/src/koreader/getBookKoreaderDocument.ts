import { getKoreaderFileDigest } from "@prose-reader/koreader"
import { getBookFile } from "../download/getBookFile.shared"

/**
 * The `document` a KOReader sync server files the book's positions under, for
 * the file this device has: its digest as KOReader computes it by default
 * ("Binary" document matching). `null` when the book is not downloaded here.
 */
export const getBookKoreaderDocument = async (bookId: string) => {
  const file = await getBookFile(bookId)

  return file ? getKoreaderFileDigest(file.data) : null
}
