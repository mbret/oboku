import { Metadata } from "./types"
import { getGoogleMetadata } from "./google/getGoogleMetadata"
import { Logger } from "@libs/logger"

const swallowError = async <T>(promise: Promise<T>) => {
  try {
    return await promise
  } catch (e) {
    Logger.error(e)
  }
}

export const getBookSourcesMetadata = async (
  metadata: Metadata
): Promise<Metadata[]> => {
  const list = []

  const google = await swallowError(getGoogleMetadata(metadata))

  if (google) {
    list.push(google)
  }

  return list
}
