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
    const cover = result.relationships.find(
      (relationship) => relationship.type === "cover_art",
    )

    if (result) {
      return {
        status: result.attributes.status,
        description: result.attributes.description.en,
        type: "mangadex",
        title: {
          en: result.attributes.title.en,
        },
        // x/10
        rating: seriesStastistics?.rating?.bayesian,
        ...(cover && {
          cover: {
            uri: `https://mangadex.org/covers/${result.id}/${cover.attributes.fileName}`,
          },
        }),
      } satisfies CollectionMetadata
    }
  } catch (e) {
    Logger.error(e)

    return undefined
  }
}
