import { Metadata } from "../types"
import { findByISBN, findByTitle } from "@libs/google/googleBooksApi"
import { parseGoogleMetadata } from "./parseGoogleMetadata"

export const getGoogleMetadata = async (
  metadata: Metadata
): Promise<Metadata> => {
  const response = metadata.isbn
    ? await findByISBN(metadata.isbn)
    : await findByTitle(metadata.title ?? "")

  return parseGoogleMetadata(response)
}
