import { Logger } from "@nestjs/common"
import type { CollectionMetadata } from "@oboku/shared"
import { isAxiosError } from "axios"
import { getSeriesMetadata } from "src/lib/metadata/biblioreads/getSeriesMetadata"
import { getGoogleSeriesMetadata } from "src/lib/metadata/google/getGoogleSeriesMetadata"
import { getSeriesMetadata as getMangadexSeriesMetadata } from "src/lib/metadata/mangadex/getSeriesMetadata"
import { getSeriesMetadata as getComicVineSeriesMetadata } from "src/lib/metadata/comicvine/getSeriesMetadata"
import { getSeriesMetadata as getMangaUpdatesSeriesMetadata } from "src/lib/metadata/mangaupdates/getSeriesMetadata"

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
    sources,
    comicVineApiKey,
  }: {
    comicVineApiKey: undefined | string
    sources: CollectionMetadata["type"][]
  },
): Promise<CollectionMetadata[]> => {
  const list = []

  if (sources.includes("googleBookApi")) {
    const google = await swallowGoogleError(getGoogleSeriesMetadata())

    if (google) {
      list.push(google)
    }
  }

  const biblioreadsPromise = sources.includes("biblioreads")
    ? getSeriesMetadata(metadata)
    : Promise.resolve(undefined)
  const comicVinePromise =
    !comicVineApiKey || !sources.includes("comicvine")
      ? Promise.resolve(undefined)
      : getComicVineSeriesMetadata({
          ...metadata,
          comicVineApiKey,
        })
  const mangaupdatesPromise = sources.includes("mangaupdates")
    ? getMangaUpdatesSeriesMetadata(metadata)
    : Promise.resolve(undefined)
  const mangadexPromise = sources.includes("mangadex")
    ? getMangadexSeriesMetadata(metadata)
    : Promise.resolve(undefined)

  const [biblioreads, comicvine, mangaupdates, mangadex] = await Promise.all([
    biblioreadsPromise,
    comicVinePromise,
    mangaupdatesPromise,
    mangadexPromise,
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
