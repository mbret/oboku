import { Logger } from "@libs/logger"
import { getSeriesMetadata } from "@libs/metadata/biblioreads/getSeriesMetadata"
import { getGoogleSeriesMetadata } from "@libs/metadata/google/getGoogleSeriesMetadata"
import { CollectionMetadata } from "@oboku/shared"
import { isAxiosError } from "axios"

const swallowGoogleError = async <T>(promise: Promise<T>) => {
  try {
    return await promise
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 429) {
      Logger.error("Google API too many request error")
    } else {
      Logger.error(error)
    }
  }
}

export const fetchMetadata = async (
  metadata: { title: string },
  { googleApiKey, withGoogle }: { googleApiKey?: string; withGoogle: boolean }
): Promise<CollectionMetadata[]> => {
  const list = []

  if (withGoogle) {
    const google = await swallowGoogleError(
      getGoogleSeriesMetadata(metadata, googleApiKey ?? "")
    )

    if (google) {
      list.push(google)
    }
  }

  const biblioreads = await getSeriesMetadata(metadata.title)

  if (biblioreads) {
    list.push(biblioreads)
  }

  return list
}
