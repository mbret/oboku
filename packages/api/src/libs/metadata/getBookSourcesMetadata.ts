import { Metadata } from "./types"
import { getGoogleMetadata } from "./google/getGoogleMetadata"
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
  { googleApiKey }: { googleApiKey?: string }
): Promise<Metadata[]> => {
  const list = []

  const google = await swallowGoogleError(
    getGoogleMetadata(metadata, googleApiKey ?? "")
  )

  if (google) {
    list.push(google)
  }

  return list
}
