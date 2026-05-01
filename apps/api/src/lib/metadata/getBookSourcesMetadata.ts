import type { GoogleBookApiMetadata } from "@oboku/shared"
import {
  type GoogleBookLookupInput,
  getGoogleBookMetadata,
} from "./google/getGoogleBookMetadata"
import { Logger } from "@nestjs/common"
import { isAxiosError } from "axios"
import { AppConfigService } from "src/config/AppConfigService"

const swallowGoogleError = async <T>(promise: Promise<T>) => {
  try {
    return await promise
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 429) {
      Logger.error("Google API too many request error")
    } else if (isAxiosError(error)) {
      Logger.error(
        "Google API error",
        error.response?.status,
        error.response?.data,
      )
    } else {
      Logger.error(error)
    }
  }
}

export const getBookSourcesMetadata = async (
  lookup: GoogleBookLookupInput,
  {
    googleApiKey,
    withExternalSources,
  }: { googleApiKey?: string; withExternalSources: boolean },
  config: AppConfigService,
): Promise<GoogleBookApiMetadata[]> => {
  const list: GoogleBookApiMetadata[] = []

  if (!withExternalSources) return list

  const google = await swallowGoogleError(
    getGoogleBookMetadata(lookup, googleApiKey ?? "", config),
  )

  if (google) {
    list.push(google)
  }

  return list
}
