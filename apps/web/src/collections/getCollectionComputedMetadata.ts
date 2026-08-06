import {
  type CollectionComputedMetadata,
  type CollectionDocType,
  computeCollectionMetadata,
} from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"

type DeprecatedDocType = {
  name: string
}

export const getCollectionComputedMetadata = (
  item?: DeepReadonlyObject<
    CollectionDocType & Partial<DeprecatedDocType>
  > | null,
): CollectionComputedMetadata => computeCollectionMetadata(item?.metadata ?? [])
