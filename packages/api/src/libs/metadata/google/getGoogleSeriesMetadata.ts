import { findSeriesByTitle } from "@libs/google/googleBooksApi"
import { CollectionMetadata } from "@oboku/shared"

export const getGoogleSeriesMetadata = async (
  metadata: { title: string },
  apiKey: string
): Promise<CollectionMetadata | undefined> => {
  const response = await findSeriesByTitle(metadata.title ?? "", apiKey)

  console.log(response)

  return undefined
}
