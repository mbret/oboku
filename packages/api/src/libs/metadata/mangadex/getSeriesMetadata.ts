import { Logger } from "@libs/logger"
import { searchManga } from "./searchManga"
import { CollectionMetadata } from "@oboku/shared"
import { getStatistics } from "./getStatistics"

export const getSeriesMetadata = async (metadata: {
  title: string
  year?: string
}): Promise<CollectionMetadata | undefined> => {
  try {
    const searchResponse = await searchManga(metadata.title)

    const result = (searchResponse.data.data ?? [])[0]

    if (!result) return undefined

    const statisticsResponse = await getStatistics([result.id])
    const statistics = statisticsResponse.data.statistics ?? {}
    const seriesStastistics = statistics[result.id]

    if (result) {
      return {
        status: result.attributes.status,
        description: result.attributes.description.en,
        type: "mangadex",
        title: {
          en: result.attributes.title.en
        },
        // x/10
        rating: seriesStastistics?.rating?.bayesian
      } satisfies CollectionMetadata
    }
  } catch (e) {
    Logger.error(e)

    return undefined
  }
}
