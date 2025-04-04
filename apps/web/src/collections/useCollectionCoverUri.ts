import { type CollectionDocType, getCollectionCoverKey } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { useBookCover } from "../books/useBookCover"
import { configuration } from "../config/configuration"

export const useCollectionCoverUri = (
  collection?: DeepReadonlyObject<CollectionDocType> | null,
) => {
  const assetHash = collection?.lastMetadataUpdatedAt?.toString()
  const { coverSrc: firstBookCoverSrc, hasCoverMetadata } = useBookCover({
    bookId: collection?.books[0],
  })
  const urlParams = new URLSearchParams({
    ...(assetHash && {
      hash: assetHash,
    }),
  })

  if (!collection) return { uri: undefined, hasCover: undefined }

  const hasCover = !!collection.metadata?.find((metadata) => metadata.cover)

  if (!hasCover) {
    if (firstBookCoverSrc && hasCoverMetadata) {
      return {
        uri: firstBookCoverSrc,
        hasCover: true,
      }
    }

    return { uri: undefined, hasCover: false }
  }

  return {
    uri: `${configuration.API_URL}/covers/${getCollectionCoverKey(collection?._id)}?${urlParams.toString()}`,
    hasCover: true,
  }
}
