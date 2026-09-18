import type { CollectionMetadata } from "@oboku/shared"
import { Logger } from "@nestjs/common"
import { getSeries } from "./getSeries"

export const getSeriesMetadata = async (metadata: {
  title: string
  year?: string
}): Promise<CollectionMetadata | undefined> => {
  try {
    const series = await getSeries(metadata.title)

    if (!series) return undefined

    return {
      type: "biblioreads",
      title: series?.data.title,
      description: series?.data.desc,
    }
  } catch (e) {
    Logger.error(e)

    return undefined
  }
}
