import {
  identifierValue,
  mainTitle,
  type ResolvedMetadata,
} from "@prose-reader/archive-reader"
import type { BookMetadata, BookMetadataFields } from "./index"

type Primitive = string | number | bigint | boolean | symbol | null | undefined

/**
 * Lets callers pass deeply frozen documents without copying them. Primitives
 * are matched first, so branded strings such as archive-reader's
 * `string & {}` stay strings.
 */
export type DeepReadonly<T> = T extends Primitive
  ? T
  : T extends ReadonlyArray<infer TItem>
    ? ReadonlyArray<DeepReadonly<TItem>>
    : { readonly [K in keyof T]: DeepReadonly<T[K]> }

/**
 * {@link BookMetadataFields} as {@link getBookMetadataFields} reads them out
 * of an entry: a field the entry does not state can be present as
 * `undefined`.
 */
export type ReadonlyBookMetadataFields = {
  readonly [K in keyof BookMetadataFields]?:
    | DeepReadonly<BookMetadataFields[K]>
    | undefined
}

const authorNames = (metadata: DeepReadonly<ResolvedMetadata>) => {
  const names = (metadata.contributors ?? [])
    .filter((contributor) => contributor.roles.includes("author"))
    .map((contributor) => contributor.name)

  return names.length > 0 ? names : undefined
}

const nonEmpty = <TItem>(values: ReadonlyArray<TItem> | undefined) =>
  values?.length ? values : undefined

/**
 * The display fields of a record in archive-reader's vocabulary. Edition
 * details win over the original publication's, as in the lookup input
 * metadata-fetcher builds from a resolved archive.
 */
const getResolvedMetadataFields = (
  metadata: DeepReadonly<ResolvedMetadata>,
): ReadonlyBookMetadataFields => ({
  title: mainTitle(metadata),
  authors: authorNames(metadata),
  description: metadata.description,
  rating: metadata.aggregateRating?.value,
  coverLink: metadata.cover?.uri,
  pageCount: metadata.numberOfPages,
  date:
    metadata.publication?.edition?.date ?? metadata.publication?.original?.date,
  publisher:
    metadata.publication?.edition?.publisher ??
    metadata.publication?.original?.publisher,
  rights: metadata.rights,
  languages: nonEmpty(metadata.languages),
  subjects: nonEmpty(metadata.subjects),
  isbn: identifierValue(metadata.identifiers, "ISBN"),
  googleVolumeId: identifierValue(metadata.identifiers, "GoogleBooks"),
})

const withoutType = <TEntry extends { type: string }>({
  type: _,
  ...fields
}: TEntry) => fields

/**
 * What an entry of `book.metadata` says about the book, as display fields,
 * whatever shape the entry is stored in.
 */
export const getBookMetadataFields = (
  entry: DeepReadonly<BookMetadata>,
): ReadonlyBookMetadataFields => {
  switch (entry.type) {
    case "file":
      return entry.metadata === undefined
        ? withoutType(entry)
        : {
            ...getResolvedMetadataFields(entry.metadata),
            coverConfidence: entry.metadata.cover?.confidence,
            contentType: entry.contentType,
          }
    case "catalog":
      return getResolvedMetadataFields(entry.metadata)
    default:
      return withoutType(entry)
  }
}
