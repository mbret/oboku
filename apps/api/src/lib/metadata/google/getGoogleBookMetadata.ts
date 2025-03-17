import type { Metadata } from "../types"
import { parseGoogleMetadata } from "./parseGoogleMetadata"
import { refineTitle } from "../refineTitle"
import {
  findByISBN,
  findByTitle,
  findByVolumeId,
} from "src/lib/google/googleBooksApi"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "src/features/config/types"

export const getGoogleBookMetadata = async (
  metadata: Metadata,
  apiKey: string,
  config: ConfigService<EnvironmentVariables>,
): Promise<Metadata | undefined> => {
  let titleRefined = metadata.title ?? ""
  let response = metadata.isbn
    ? await findByISBN(metadata.isbn, apiKey, config)
    : metadata.googleVolumeId
      ? await findByVolumeId(metadata.googleVolumeId, apiKey, config)
      : await findByTitle(titleRefined, apiKey, config)

  console.log("[google] [getGoogleBookMetadata]", { response })
  if (!response.items?.length) {
    titleRefined = refineTitle(metadata.title ?? "", 1)

    console.log(
      `[getGoogleBookMetadata]`,
      `was unable to find result for isbn:${metadata.isbn} or title:${metadata.title} or volumeId:${metadata.googleVolumeId}. Trying to refine title with 1 deepness ${titleRefined}`,
    )

    response = await findByTitle(titleRefined, apiKey, config)

    if (!response.items?.length) {
      titleRefined = refineTitle(metadata.title ?? "", 2)

      console.log(
        `[getGoogleBookMetadata]`,
        `was unable to find result for ${titleRefined}. Trying to refine title with 2 deepness ${titleRefined}`,
      )

      response = await findByTitle(titleRefined, apiKey, config)
    }

    if (!response.items?.length) {
      titleRefined = refineTitle(metadata.title ?? "", 3)

      console.log(
        `[getGoogleBookMetadata]`,
        `was unable to find result for ${titleRefined}. Trying to refine title with 3 deepness ${titleRefined}`,
      )

      response = await findByTitle(titleRefined, apiKey, config)
    }

    if (!response.items?.length) {
      titleRefined = refineTitle(metadata.title ?? "", 4)

      console.log(
        `[getGoogleBookMetadata]`,
        `was unable to find result for ${titleRefined}. Trying to refine title with 4 deepness ${titleRefined}`,
      )

      response = await findByTitle(titleRefined, apiKey, config)
    }

    if (!response.items?.length) {
      titleRefined = refineTitle(metadata.title ?? "", 5)

      console.log(
        `[getGoogleBookMetadata]`,
        `was unable to find result for ${titleRefined}. Trying to refine title with 5 deepness ${titleRefined}`,
      )

      response = await findByTitle(titleRefined, apiKey, config)
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
