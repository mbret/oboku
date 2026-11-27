import {
  type BookMetadata,
  type BookTitleFormat,
  type DeepReadonly,
  getBookMetadataEntryFields as getEntryFields,
  getBookMetadataIdentifiers as getEntryIdentifiers,
  type ReadonlyBookMetadataFields,
} from "@oboku/shared"
import type { MetadataIdentifier } from "@prose-reader/archive-reader"
import type { DeepReadonlyObject } from "rxdb"

/** How the app words what the metadata merge adds to a book's title. */
export const BOOK_TITLE_FORMAT: BookTitleFormat = {
  formatVolumeTitle(title, position) {
    return `${title} Vol ${position}`
  },
}

const fromRxdbEntry = (rxdbEntry: DeepReadonlyObject<BookMetadata>) =>
  // rxdb's DeepReadonly turns the branded `string & {}` types of
  // prose-reader's metadata into objects. The stored values are the plain
  // JSON strings those types describe.
  rxdbEntry as unknown as DeepReadonly<BookMetadata>

/** {@link getEntryFields} for an entry of an rxdb book document. */
export const getBookMetadataEntryFields = (
  rxdbEntry: DeepReadonlyObject<BookMetadata>,
): ReadonlyBookMetadataFields =>
  getEntryFields(fromRxdbEntry(rxdbEntry), BOOK_TITLE_FORMAT)

/** {@link getEntryIdentifiers} for an entry of an rxdb book document. */
export const getBookMetadataEntryIdentifiers = (
  rxdbEntry: DeepReadonlyObject<BookMetadata>,
): ReadonlyArray<MetadataIdentifier> =>
  getEntryIdentifiers(fromRxdbEntry(rxdbEntry))
