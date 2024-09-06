import { CollectionDocType, CollectionMetadata, mergeWith } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"

type DeprecatedDocType = {
  name: string
}

type Return = DeepReadonlyObject<Omit<CollectionMetadata, "type" | "title">> & {
  language?: string
  displayableDate?: string
  title?: string
}

export const getCollectionComputedMetadata = (
  item?: DeepReadonlyObject<
    CollectionDocType & Partial<DeprecatedDocType>
  > | null
): Return => {
  const list = item?.metadata ?? []

  const orderedList = [...list].sort((a, b) => {
    // mangadex has higher priority
    if (a.type === "mangadex") return 1

    // mangaupdates has priority
    if (a.type === "mangaupdates" && b.type === "biblioreads") return 1

    /**
     * link is the raw format, we don't want it to be on top
     */
    return a.type === "link" ? -1 : 1
  })

  const reducedMetadata = orderedList.reduce((acc, { type, ...item }) => {
    const title = item.title

    const computedTitle = typeof title === "string" ? title : title?.en

    const mergedValue = mergeWith(
      acc,
      {
        ...item,
        title: computedTitle
      },
      (objValue, srcValue) => {
        if (srcValue === null) return objValue ?? srcValue

        return undefined
      }
    ) as Return

    return mergedValue
  }, {} as Return)

  return reducedMetadata
}
