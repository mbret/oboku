import { Metadata } from "../types"
import { findByISBN, findByTitle } from "@libs/google/googleBooksApi"
import { parseGoogleMetadata } from "./parseGoogleMetadata"
import { Logger } from "@libs/logger"
import { refineTitle } from "../refineTitle"

export const getGoogleBookMetadata = async (
  metadata: Metadata,
  apiKey: string
): Promise<Metadata | undefined> => {
  let response = metadata.isbn
    ? await findByISBN(metadata.isbn, apiKey)
    : await findByTitle(metadata.title ?? "", apiKey)

  if (!response.items?.length) {
    let titleRefined = refineTitle(metadata.title ?? "", 1)

    Logger.info(
      `getGoogleMetadata was unable to find result for isbn:${metadata.isbn} or title:${metadata.title}. Trying to refine title with 1 deepness ${titleRefined}`
    )

    response = await findByTitle(titleRefined, apiKey)

    if (!response.items?.length) {
      titleRefined = refineTitle(metadata.title ?? "", 2)

      Logger.info(
        `getGoogleMetadata was unable to find result for ${titleRefined}. Trying to refine title with 2 deepness ${titleRefined}`
      )

      response = await findByTitle(titleRefined, apiKey)
    }

    if (!response.items?.length) {
      titleRefined = refineTitle(metadata.title ?? "", 3)

      Logger.info(
        `getGoogleMetadata was unable to find result for ${titleRefined}. Trying to refine title with 3 deepness ${titleRefined}`
      )

      response = await findByTitle(titleRefined, apiKey)
    }
  }

  const parsedMetadata = parseGoogleMetadata(response)

  if (!Object.keys(parsedMetadata)) return undefined

  return {
    ...parsedMetadata,
    type: "googleBookApi"
  }
}
