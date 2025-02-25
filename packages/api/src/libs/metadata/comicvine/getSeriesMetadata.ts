import type { CollectionMetadata } from "@oboku/shared"
import { Logger } from "@libs/logger"
import { URL } from "url"
import axios from "axios"

type Result = {
  error: "OK"
  limit: number
  offset: number
  number_of_page_results: number
  number_of_total_results: number
  status_code: number
  results: {
    aliases: string
    api_detail_url: string
    count_of_issues: number
    date_added: string
    date_last_updated: string
    deck: null
    description: string
    first_issue: {
      api_detail_url: string
      id: number
      name: string
      issue_number: string
    }
    id: number
    image?: {
      icon_url: string
      medium_url: string
      screen_url: string
      screen_large_url: string
      small_url: string
      super_url: string
      thumb_url: string
      tiny_url: string
      original_url?: string
      image_tags: string
    }
    last_issue: {
      api_detail_url: string
      id: number
      name: string
      issue_number: string
    }
    name: string
    publisher: {
      api_detail_url: string
      id: number
      name: string
    }
    site_detail_url: string
    start_year: string
    resource_type: "volume"
  }[]
}

export const getSeriesMetadata = async ({
  comicVineApiKey,
  ...metadata
}: {
  title: string
  year?: string
  comicVineApiKey: string
}): Promise<CollectionMetadata | undefined> => {
  try {
    const url = new URL(`https://comicvine.gamespot.com/api/search`)

    url.searchParams.append(`api_key`, comicVineApiKey)
    url.searchParams.append(`query`, metadata.title)
    url.searchParams.append(`format`, `json`)
    url.searchParams.append(`resources`, `volume`)

    const response = await axios<Result>({
      method: "get",
      url: url.toString(),
    })

    let result = response.data.results[0]

    if (metadata.year) {
      const refinedResultsWithYear = response.data.results.filter(
        (item) => !item.start_year || item.start_year === metadata.year,
      )
      result = refinedResultsWithYear[0]
    }

    if (!result) return undefined

    return {
      type: "comicvine",
      title: result?.name,
      description: result?.description,
      aliases: result?.aliases ? [result?.aliases] : undefined,
      startYear: result?.start_year ? Number(result?.start_year) : undefined,
      publisherName: result?.publisher.name,
      ...(result.image?.original_url && {
        cover: {
          uri: result.image?.original_url,
        },
      }),
    } satisfies CollectionMetadata
  } catch (e) {
    Logger.error(e)

    return undefined
  }
}
