import { CollectionMetadata } from "@oboku/shared"
import { Logger } from "@libs/logger"
import { URL } from "url"
import axios from "axios"

type Result = {
  total_hits: number
  page: number
  per_page: number
  results: {
    record?: {
      series_id: number
      title: string
      url: string
      description: string
      image: {
        url: {
          original: string
          thumb: string
        }
        height: number
        width: number
      }
      type: string
      year: string
      bayesian_rating: number
      rating_votes: number
      genres: {
        genre: string
      }[]
      last_updated: {
        timestamp: number
        as_rfc3339: string
        as_string: string
      }
    }
    hit_title: string
    metadata: {
      user_list: {
        list_type: null
        list_icon: null
        status: {
          volume: null
          chapter: null
        }
      }
      user_genre_highlights: []
    }
  }[]
}

export const getSeriesMetadata = async (metadata: {
  title: string
  year?: string
}): Promise<CollectionMetadata | undefined> => {
  try {
    const url = new URL(`https://api.mangaupdates.com/v1/series/search`)

    const response = await axios<Result>({
      method: "post",
      url: url.toString(),
      data: {
        search: metadata.title,
        ...(metadata.year && {
          year: metadata.year
        })
      }
    })

    const result = response.data.results[0]

    if (!result) return undefined

    return {
      type: "mangaupdates",
      title: result?.record?.title,
      description: result?.record?.description,
      rating: result?.record?.bayesian_rating,
      startYear: result?.record?.year ? Number(result.record.year) : undefined
    } satisfies CollectionMetadata
  } catch (e) {
    Logger.error(e)

    return undefined
  }
}
