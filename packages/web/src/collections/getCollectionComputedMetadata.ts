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
    const priority: Record<CollectionMetadata["type"], number> = {
      user: 5,
      mangadex: 4,
      mangaupdates: 3,
      biblioreads: 2,
      link: 1,
      googleBookApi: 0,
      comicvine: -1
    }

    return (priority[a.type] || 0) - (priority[b.type] || 0)
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
