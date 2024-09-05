import { CollectionDocType } from "@oboku/shared"
import { useMemo } from "react"
import { getCollectionComputedMetadata } from "./getCollectionComputedMetadata"
import { DeepReadonlyObject } from "rxdb"
import { useCollectionDisplayTitle } from "./useCollectionDisplayTitle"

export const useCollectionComputedMetadata = (
  collection?: DeepReadonlyObject<CollectionDocType> | null
) => {
  const metadata = useMemo(
    () => getCollectionComputedMetadata(collection),
    [collection]
  )

  const displayTitle = useCollectionDisplayTitle(metadata.title)

  return useMemo(
    () => ({
      ...metadata,
      displayTitle
    }),
    [metadata, displayTitle]
  )
}
