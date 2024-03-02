import { BookDocType, DeprecatedBookDocType, Metadata } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"

type Return = DeepReadonlyObject<Omit<Metadata, "type">>

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

export const getMetadataFromBook = (
  book?: DeepReadonlyObject<BookDocType & Partial<DeprecatedBookDocType>> | null
): Return => {
  const list = book?.metadata ?? []

  const deprecated: Metadata = {
    type: "deprecated",
    title: book?.title || undefined,
    authors: book?.creator ? [book.creator] : undefined
  }

  /**
   * link is the raw format, we don't want it to be on top
   */
  const orderedList = [deprecated, ...list].sort((a, b) =>
    a.type === "link" ? -1 : 1
  )

  const reducedMetadata = orderedList.reduce((acc, item) => {
    return {
      ...mergeObjects(acc, item),
      authors: [...(acc.authors ?? []), ...(item.authors ?? [])]
    } satisfies Return
  }, {} as Return)

  return reducedMetadata
}
