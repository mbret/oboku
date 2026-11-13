import {
  type BookDocType,
  type BookDisplayMetadata,
  type DeepReadonly,
  getMetadataFromBook as getDisplayMetadata,
} from "@oboku/shared"
import { useMemo } from "react"
import type { DeepReadonlyObject, RxDocument } from "rxdb"

type BookWithMetadata = Pick<BookDocType, "metadata" | "metadataSourcePriority">

/** {@link getDisplayMetadata} for an rxdb book document. */
export const getMetadataFromBook = (
  book?: DeepReadonlyObject<BookWithMetadata> | null | RxDocument<BookDocType>,
): BookDisplayMetadata =>
  getDisplayMetadata(
    // rxdb's DeepReadonly turns the branded `string & {}` types of
    // prose-reader's metadata into objects. The stored values are the plain
    // JSON strings those types describe.
    book as unknown as DeepReadonly<BookWithMetadata> | null | undefined,
  )

export const useMetadataFromBook = (
  book?: DeepReadonlyObject<BookDocType> | null,
) => {
  const { metadata, metadataSourcePriority } = book ?? {}

  return useMemo(() => {
    return getMetadataFromBook({ metadata, metadataSourcePriority })
  }, [metadata, metadataSourcePriority])
}
