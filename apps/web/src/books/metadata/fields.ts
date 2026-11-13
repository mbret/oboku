import {
  type BookMetadata,
  type DeepReadonly,
  getBookMetadataEntryFields as getEntryFields,
  type ReadonlyBookMetadataFields,
} from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"

/** {@link getEntryFields} for an entry of an rxdb book document. */
export const getBookMetadataEntryFields = (
  rxdbEntry: DeepReadonlyObject<BookMetadata>,
): ReadonlyBookMetadataFields =>
  // rxdb's DeepReadonly turns the branded `string & {}` types of
  // prose-reader's metadata into objects. The stored values are the plain
  // JSON strings those types describe.
  getEntryFields(rxdbEntry as unknown as DeepReadonly<BookMetadata>)
