import { Metadata } from "./types"
import { getGoogleMetadata } from "./google/getGoogleMetadata"

export const getBookSourcesMetadata = async (
  metadata: Metadata
): Promise<Metadata[]> => {
  const google = await getGoogleMetadata(metadata)

  return [google]
}
