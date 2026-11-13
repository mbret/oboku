import {
  type BookMetadata,
  type BookTitleFormat,
  type DeepReadonly,
  getBookMetadataEntryFields as getEntryFields,
  type ReadonlyBookMetadataFields,
} from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"

/** How the app words what the metadata merge adds to a book's title. */
export const BOOK_TITLE_FORMAT: BookTitleFormat = {
  formatVolumeTitle(title, position) {
    return `${title} Vol ${position}`
  },
}

/** {@link getEntryFields} for an entry of an rxdb book document. */
export const getBookMetadataEntryFields = (
  rxdbEntry: DeepReadonlyObject<BookMetadata>,
): ReadonlyBookMetadataFields =>
  // rxdb's DeepReadonly turns the branded `string & {}` types of
  // prose-reader's metadata into objects. The stored values are the plain
  // JSON strings those types describe.
  getEntryFields(
    rxdbEntry as unknown as DeepReadonly<BookMetadata>,
    BOOK_TITLE_FORMAT,
  )
