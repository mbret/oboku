import type { LegacyGoogleBookApiMetadata } from "@oboku/shared"
import { parseGoogleMetadata } from "./parseGoogleMetadata.js"
import { refineTitle } from "../refineTitle.js"
import {
  findByISBN,
  findByTitle,
  findByVolumeId,
} from "../../google/googleBooksApi.js"
import { AppConfigService } from "../../../config/AppConfigService.js"

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

const TITLE_REFINE_LEVELS = [1, 2, 3, 4, 5] as const

export const getGoogleBookMetadata = async (
  input: GoogleBookLookupInput,
  apiKey: string,
  config: AppConfigService,
): Promise<LegacyGoogleBookApiMetadata | undefined> => {
  const { isbn, googleVolumeId, title = "" } = input
  /**
   * A volume id addresses one Google Books record, where an ISBN can match
   * several printings — so it wins here even though ISBN stays the priority
   * identifier everywhere else.
   */
  let response = googleVolumeId
    ? await findByVolumeId(googleVolumeId, apiKey, config)
    : isbn
      ? await findByISBN(isbn, apiKey, config)
      : await findByTitle(title, apiKey, config)
  const isFirstQueryByTitle = !googleVolumeId && !isbn
  let lastTitleSent = isFirstQueryByTitle ? title : undefined

  console.log("[google] [getGoogleBookMetadata]", { response })

  for (const level of TITLE_REFINE_LEVELS) {
    const isMatchFound = !!response.items?.length

    if (isMatchFound) break

    const titleRefined = refineTitle(title, level)
    const isTitleAlreadySent = titleRefined === lastTitleSent

    if (isTitleAlreadySent) continue

    console.log(
      `[getGoogleBookMetadata]`,
      `was unable to find result for isbn:${isbn} or title:${title} or volumeId:${googleVolumeId}. Trying to refine title with ${level} deepness ${titleRefined}`,
    )

    response = await findByTitle(titleRefined, apiKey, config)
    lastTitleSent = titleRefined
  }

  console.log(
    `${response.items?.length ?? 0} items found from google book API for title "${title}" & isbn "${isbn}" thanks to refined title "${lastTitleSent}"`,
  )

  const parsedMetadata = parseGoogleMetadata(response)
  const hasMetadata = Object.keys(parsedMetadata).length > 0

  if (!hasMetadata) return undefined

  return {
    ...parsedMetadata,
    type: "googleBookApi",
  }
}
