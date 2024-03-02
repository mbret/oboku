import { BookDocType, Metadata } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"

type Return = DeepReadonlyObject<Omit<Metadata, "type">>

export const getMetadataFromBook = (
  book?: DeepReadonlyObject<BookDocType> | null
): Return => {
  const list = book?.metadata ?? []

  /**
   * link is the raw format, we don't want it to be on top
   */
  const orderedList = [...list].sort((a, b) => (a.type === "link" ? -1 : 1))

  return orderedList.reduce((acc, item) => {
    return {
      ...acc,
      ...item,
      authors: [...(acc.authors ?? []), ...(item.authors ?? [])]
    } satisfies Return
  }, {} as Return)
}
