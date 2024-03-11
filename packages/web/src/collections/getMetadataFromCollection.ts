import { CollectionDocType, CollectionMetadata } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"

type DeprecatedDocType = {
  name: string
}

type Return = DeepReadonlyObject<Omit<CollectionMetadata, "type">> & {
  language?: string
  displayableDate?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericObject = { [key: string]: any }

function mergeObjects(a: GenericObject, b: GenericObject): GenericObject {
  return Object.entries(b).reduce(
    (acc, [key, value]) => {
      // If the value in `b` is not `undefined`, use it; otherwise, retain the value from `a`.
      acc[key] = value !== undefined ? value : a[key]

      return acc
    },
    { ...a }
  ) // Start with a shallow copy of `a` to ensure we don't mutate it.
}

export const getMetadataFromCollection = (
  item?: DeepReadonlyObject<
    CollectionDocType & Partial<DeprecatedDocType>
  > | null
): Return => {
  const list = item?.metadata ?? []

  /**
   * link is the raw format, we don't want it to be on top
   */
  const orderedList = [...list].sort((a, b) => (a.type === "link" ? -1 : 1))

  const reducedMetadata = orderedList.reduce((acc, item) => {
    const mergedValue = mergeObjects(acc, item) as Return

    return {
      ...mergedValue
    } satisfies Return
  }, {} as Return)

  return reducedMetadata
}
