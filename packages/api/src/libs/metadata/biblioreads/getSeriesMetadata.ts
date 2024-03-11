import { CollectionMetadata } from "@oboku/shared"
import { getSeries } from "./getSeries"
import { Logger } from "@libs/logger"

export const getSeriesMetadata = async (
  title: string
): Promise<CollectionMetadata | undefined> => {
  try {
    const series = await getSeries(title)

    return {
      type: "biblioreads",
      title: series?.data.title,
      description: series?.data.desc
    }
  } catch (e) {
    Logger.error(e)

    return undefined
  }
}
