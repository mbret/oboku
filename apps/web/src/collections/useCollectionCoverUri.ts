import type { CollectionDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { useBookCoverUrl } from "../books/useBookCover"
import { useConfig } from "../config/useConfig"
import { useHeldBookIds } from "../books/useHeldBookIds"

export const useCollectionCoverUri = (
  collection?: DeepReadonlyObject<CollectionDocType> | null,
) => {
  const { data: config } = useConfig()
  const assetHash = collection?.lastMetadataUpdatedAt?.toString()
  const heldBookIds = useHeldBookIds(collection?.books)
  const { coverSrc: firstBookCoverSrc, hasCoverMetadata } = useBookCoverUrl({
    bookId: heldBookIds?.[0],
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
    uri: `${config?.API_URL}/covers/collections/${collection._id}?${urlParams.toString()}`,
    hasCover: true,
  }
}
