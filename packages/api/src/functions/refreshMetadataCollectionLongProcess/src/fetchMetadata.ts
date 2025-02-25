import { Logger } from "@libs/logger"
import { getSeriesMetadata } from "@libs/metadata/biblioreads/getSeriesMetadata"
import { getSeriesMetadata as getMangadexSeriesMetadata } from "@libs/metadata/mangadex/getSeriesMetadata"
import { getSeriesMetadata as getComicVineSeriesMetadata } from "@libs/metadata/comicvine/getSeriesMetadata"
import { getSeriesMetadata as getMangaUpdatesSeriesMetadata } from "@libs/metadata/mangaupdates/getSeriesMetadata"
import { getGoogleSeriesMetadata } from "@libs/metadata/google/getGoogleSeriesMetadata"
import type { CollectionMetadata } from "@oboku/shared"
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
  metadata: { title: string; year?: string },
  {
    withGoogle,
    comicVineApiKey,
  }: { googleApiKey?: string; withGoogle: boolean; comicVineApiKey: string },
): Promise<CollectionMetadata[]> => {
  const list = []

  if (withGoogle) {
    const google = await swallowGoogleError(getGoogleSeriesMetadata())

    if (google) {
      list.push(google)
    }
  }

  const [biblioreads, comicvine, mangaupdates, mangadex] = await Promise.all([
    getSeriesMetadata(metadata),
    getComicVineSeriesMetadata({
      ...metadata,
      comicVineApiKey,
    }),
    getMangaUpdatesSeriesMetadata(metadata),
    getMangadexSeriesMetadata(metadata),
  ])

  if (biblioreads) {
    list.push(biblioreads)
  }

  if (comicvine) {
    list.push(comicvine)
  }

  if (mangaupdates) {
    list.push(mangaupdates)
  }

  if (mangadex) {
    list.push(mangadex)
  }

  return list
}
