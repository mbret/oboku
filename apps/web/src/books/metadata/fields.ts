import {
  type BookMetadata,
  type DeepReadonly,
  getBookMetadataFields,
} from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"

/** {@link getBookMetadataFields} for an entry of an rxdb book document. */
export const getBookMetadataEntryFields = (
  entry: DeepReadonlyObject<BookMetadata>,
) =>
  getBookMetadataFields(
    // rxdb's DeepReadonly turns the branded `string & {}` types of
    // prose-reader's metadata into objects. The stored values are the plain
    // JSON strings those types describe.
    entry as unknown as DeepReadonly<BookMetadata>,
  )
