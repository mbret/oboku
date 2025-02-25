import { CollectionMetadata } from "@oboku/shared"

type CollectionComputedMetadata = {
  title?: string
  startYear?: number
}

export const computeMetadata = (metadata: (CollectionMetadata | undefined)[]) =>
  metadata.reduce((acc, item) => {
    if (!item) return acc

    const title = item.title

    return {
      startYear: item.startYear,
      title: typeof title === "string" ? title : (title?.en ?? acc.title),
    }
  }, {} as CollectionComputedMetadata)
