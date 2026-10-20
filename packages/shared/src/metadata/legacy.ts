/**
 * Book metadata as stored before entries followed prose-reader's shapes:
 * flat `file` entries, `googleBookApi` entries, and `googleBookApi` in
 * `metadataSourcePriority`. The API still writes the entries, so readers of
 * `book.metadata` go through {@link getBookMetadataFields} and
 * {@link getBookMetadataSource}, which read both shapes.
 *
 * TODO(ask the maintainer, added 2026-10): revisit in 2027-10 at the
 * earliest. This file goes once no stored book holds these shapes, which
 * takes a CouchDB migration (AGENTS.md, "Data migrations"), and once the
 * older versions of the app that write `googleBookApi` priorities are gone.
 */
import type { BookMetadata, BookMetadataVariant } from "./index"

/** What the catalog source was called before it held metadata-fetcher matches. */
export const LEGACY_CATALOG_SOURCE_NAME = "googleBookApi"

/**
 * Flat `file` entry: the fields the API picked out of archive-reader's
 * metadata when it extracted the file.
 */
export type LegacyFileMetadata = BookMetadataVariant<
  "file",
  | "title"
  | "authors"
  | "publisher"
  | "rights"
  | "languages"
  | "date"
  | "subjects"
  | "coverLink"
  | "coverConfidence"
  | "pageCount"
  | "contentType"
  | "isbn"
  | "googleVolumeId"
> & { metadata?: never }

/**
 * Catalog entry from before metadata-fetcher: what the Google Books API
 * returned for the book's first search hit, as flat fields. The volume's
 * identifiers were not kept.
 */
export type LegacyGoogleBookApiMetadata = BookMetadataVariant<
  typeof LEGACY_CATALOG_SOURCE_NAME,
  | "title"
  | "authors"
  | "description"
  | "formatType"
  | "rating"
  | "coverLink"
  | "pageCount"
  | "date"
  | "publisher"
  | "languages"
  | "subjects"
>

export const isLegacyFileMetadata = (
  entry: BookMetadata,
): entry is LegacyFileMetadata =>
  entry.type === "file" && entry.metadata === undefined

/** Reads a persisted `metadataSourcePriority` value under its current name. */
export const toCurrentBookMetadataSourceName = (name: string): string =>
  name === LEGACY_CATALOG_SOURCE_NAME ? "catalog" : name
