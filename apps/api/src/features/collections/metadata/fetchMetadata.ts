import type { CollectionMetadata } from "@oboku/shared"
import { getSeriesMetadata } from "../../metadata/biblioreads/getSeriesMetadata.js"
import { getSeriesMetadata as getMangadexSeriesMetadata } from "../../metadata/mangadex/getSeriesMetadata.js"
import { getSeriesMetadata as getComicVineSeriesMetadata } from "../../metadata/comicvine/getSeriesMetadata.js"
import { getSeriesMetadata as getMangaUpdatesSeriesMetadata } from "../../metadata/mangaupdates/getSeriesMetadata.js"

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
