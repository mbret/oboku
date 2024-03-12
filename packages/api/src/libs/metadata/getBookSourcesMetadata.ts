import { Metadata } from "./types"
import { getGoogleBookMetadata } from "./google/getGoogleBookMetadata"
import { Logger } from "@libs/logger"
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

export const getBookSourcesMetadata = async (
  metadata: Metadata,
  { googleApiKey, withGoogle }: { googleApiKey?: string; withGoogle: boolean }
): Promise<Metadata[]> => {
  const list = []

  if (withGoogle) {
    const google = await swallowGoogleError(
      getGoogleBookMetadata(metadata, googleApiKey ?? "")
    )

    if (google) {
      list.push(google)
    }
  }

  return list
}
