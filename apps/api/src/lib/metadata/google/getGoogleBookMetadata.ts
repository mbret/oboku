import type { GoogleBookApiMetadata } from "@oboku/shared"
import { parseGoogleMetadata } from "./parseGoogleMetadata"
import { refineTitle } from "../refineTitle"
import {
  findByISBN,
  findByTitle,
  findByVolumeId,
} from "src/lib/google/googleBooksApi"
import { AppConfigService } from "src/config/AppConfigService"

/**
 * Lookup input for the Google Books API. The caller resolves these from
 * filename directives and the archive's own identifiers — they are not
 * carried on `LinkMetadata`.
 */
export type GoogleBookLookupInput = {
  title?: string
  isbn?: string
  googleVolumeId?: string
}

export const getGoogleBookMetadata = async (
  input: GoogleBookLookupInput,
  apiKey: string,
  config: AppConfigService,
): Promise<GoogleBookApiMetadata | undefined> => {
  const { isbn, googleVolumeId, title } = input
  let titleRefined = title ?? ""
  /**
   * A volume id addresses one Google Books record, where an ISBN can match
   * several printings — so it wins here even though ISBN stays the priority
   * identifier everywhere else.
   */
  let response = googleVolumeId
    ? await findByVolumeId(googleVolumeId, apiKey, config)
    : isbn
      ? await findByISBN(isbn, apiKey, config)
      : await findByTitle(titleRefined, apiKey, config)

  console.log("[google] [getGoogleBookMetadata]", { response })

  if (!response.items?.length) {
    titleRefined = refineTitle(title ?? "", 1)

    console.log(
      `[getGoogleBookMetadata]`,
      `was unable to find result for isbn:${isbn} or title:${title} or volumeId:${googleVolumeId}. Trying to refine title with 1 deepness ${titleRefined}`,
    )

    response = await findByTitle(titleRefined, apiKey, config)

    if (!response.items?.length) {
      titleRefined = refineTitle(title ?? "", 2)

      console.log(
        `[getGoogleBookMetadata]`,
        `was unable to find result for ${titleRefined}. Trying to refine title with 2 deepness ${titleRefined}`,
      )

      response = await findByTitle(titleRefined, apiKey, config)
    }

    if (!response.items?.length) {
      titleRefined = refineTitle(title ?? "", 3)

      console.log(
        `[getGoogleBookMetadata]`,
        `was unable to find result for ${titleRefined}. Trying to refine title with 3 deepness ${titleRefined}`,
      )

      response = await findByTitle(titleRefined, apiKey, config)
    }

    if (!response.items?.length) {
      titleRefined = refineTitle(title ?? "", 4)

      console.log(
        `[getGoogleBookMetadata]`,
        `was unable to find result for ${titleRefined}. Trying to refine title with 4 deepness ${titleRefined}`,
      )

      response = await findByTitle(titleRefined, apiKey, config)
    }

    if (!response.items?.length) {
      titleRefined = refineTitle(title ?? "", 5)

      console.log(
        `[getGoogleBookMetadata]`,
        `was unable to find result for ${titleRefined}. Trying to refine title with 5 deepness ${titleRefined}`,
      )

      response = await findByTitle(titleRefined, apiKey, config)
    }
  }

  console.log(
    `${response.items?.length ?? 0} items found from google book API for title "${title}" & isbn "${isbn}" thanks to refined title "${titleRefined}"`,
  )

  const parsedMetadata = parseGoogleMetadata(response)

  if (!Object.keys(parsedMetadata)) return undefined

  return {
    ...parsedMetadata,
    type: "googleBookApi",
  }
}
