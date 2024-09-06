import { CollectionDocType, getCollectionCoverKey } from "@oboku/shared"
import { API_URL } from "../constants.shared"
import { DeepReadonlyObject } from "rxdb"

export const useCollectionCoverUri = (
  collection?: DeepReadonlyObject<CollectionDocType> | null
) => {
  const assetHash = collection?.lastMetadataUpdatedAt?.toString()

  const urlParams = new URLSearchParams({
    ...(assetHash && {
      hash: assetHash
    })
  })

  if (!collection) return { uri: undefined, hasCover: undefined }

  const hasCover = !!collection.metadata?.find((metadata) => metadata.cover)

  if (!hasCover) return { uri: undefined, hasCover: false }

  return {
    uri: `${API_URL}/covers/${getCollectionCoverKey(collection?._id)}?${urlParams.toString()}`,
    hasCover: true
  }
}
