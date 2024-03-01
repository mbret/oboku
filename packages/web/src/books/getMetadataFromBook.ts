import { BookDocType, Metadata } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"

export const getMetadataFromBook = (
  book?: DeepReadonlyObject<BookDocType> | null
): Omit<Metadata, "type"> => {
  const list = book?.metadata ?? []

  return list.reduce((acc, item) => {
    return {
      ...acc,
      ...item
    }
  }, {})
}
