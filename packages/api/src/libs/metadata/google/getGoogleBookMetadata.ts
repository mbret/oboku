import { Metadata } from "../types"
import {
  findByISBN,
  findByTitle,
  findByVolumeId,
} from "@libs/google/googleBooksApi"
import { parseGoogleMetadata } from "./parseGoogleMetadata"
import { refineTitle } from "../refineTitle"

export const getGoogleBookMetadata = async (
  metadata: Metadata,
  apiKey: string,
): Promise<Metadata | undefined> => {
  let titleRefined = metadata.title ?? ""
  let response = metadata.isbn
    ? await findByISBN(metadata.isbn, apiKey)
    : metadata.googleVolumeId
      ? await findByVolumeId(metadata.googleVolumeId, apiKey)
      : await findByTitle(titleRefined, apiKey)

  console.log("[google] [getGoogleBookMetadata]", { response })
  if (!response.items?.length) {
    titleRefined = refineTitle(metadata.title ?? "", 1)

    console.log(
      `[getGoogleBookMetadata]`,
      `was unable to find result for isbn:${metadata.isbn} or title:${metadata.title} or volumeId:${metadata.googleVolumeId}. Trying to refine title with 1 deepness ${titleRefined}`,
    )

    response = await findByTitle(titleRefined, apiKey)

    if (!response.items?.length) {
      titleRefined = refineTitle(metadata.title ?? "", 2)

      console.log(
        `[getGoogleBookMetadata]`,
        `was unable to find result for ${titleRefined}. Trying to refine title with 2 deepness ${titleRefined}`,
      )

      response = await findByTitle(titleRefined, apiKey)
    }

    if (!response.items?.length) {
      titleRefined = refineTitle(metadata.title ?? "", 3)

      console.log(
        `[getGoogleBookMetadata]`,
        `was unable to find result for ${titleRefined}. Trying to refine title with 3 deepness ${titleRefined}`,
      )

      response = await findByTitle(titleRefined, apiKey)
    }

    if (!response.items?.length) {
      titleRefined = refineTitle(metadata.title ?? "", 4)

      console.log(
        `[getGoogleBookMetadata]`,
        `was unable to find result for ${titleRefined}. Trying to refine title with 4 deepness ${titleRefined}`,
      )

      response = await findByTitle(titleRefined, apiKey)
    }

    if (!response.items?.length) {
      titleRefined = refineTitle(metadata.title ?? "", 5)

      console.log(
        `[getGoogleBookMetadata]`,
        `was unable to find result for ${titleRefined}. Trying to refine title with 5 deepness ${titleRefined}`,
      )

      response = await findByTitle(titleRefined, apiKey)
    }
  }

  console.log(
    `${response.items?.length ?? 0} items found from google book API for title "${metadata.title}" & isbn "${metadata.isbn}" thanks to refined title "${titleRefined}"`,
  )

  const parsedMetadata = parseGoogleMetadata(response)

  if (!Object.keys(parsedMetadata)) return undefined

  return {
    ...parsedMetadata,
    type: "googleBookApi",
  }
}
