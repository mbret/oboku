import {
  type BookMetadata,
  type BOOK_METADATA_FIELDS_BY_SOURCE,
  assertNever,
  formatBytes,
} from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"

export const formatList = (
  values: readonly string[] | undefined,
): string | undefined => (values?.length ? values.join(", ") : undefined)

export const formatBookMetadataDate = (
  date: BookMetadata["date"],
): string | undefined => {
  if (!date) return undefined
  const { year, month, day } = date
  if (year !== undefined && month !== undefined && day !== undefined) {
    return new Date(`${year} ${month} ${day}`).toDateString()
  }
  if (year !== undefined && month !== undefined) {
    return `${year} ${month}`
  }
  if (year !== undefined) {
    return `${year}`
  }
  return undefined
}

/**
 * Union of every field name advertised by at least one metadata source
 * variant. Derived from {@link BOOK_METADATA_FIELDS_BY_SOURCE} so the two
 * cannot drift.
 */
export type BookMetadataFieldKey =
  (typeof BOOK_METADATA_FIELDS_BY_SOURCE)[keyof typeof BOOK_METADATA_FIELDS_BY_SOURCE][number]

const formatScalar = (
  value: string | number | undefined,
): string | undefined =>
  value === undefined || value === "" ? undefined : String(value)

/**
 * Project a single metadata field into a short human-readable string for
 * caption-style previews. Returns `undefined` when the field is absent or
 * empty so callers can compose preference-ordered fallback lists.
 *
 * Off-variant reads are safe: `BookMetadataVariant` types unsupported
 * fields as `?: never`, so e.g. asking a `googleBookApi` entry for `isbn`
 * yields `undefined` at runtime. Each branch reads `metadata[field]`
 * AFTER `field` has been narrowed to a literal, which is what lets
 * TypeScript infer the per-field value type without any casts — the
 * `?: never` parts of the discriminated union collapse to `undefined`,
 * leaving exactly the supported variant's type.
 */
export const formatBookMetadataField = (
  metadata: DeepReadonlyObject<BookMetadata> | undefined,
  field: BookMetadataFieldKey,
): string | undefined => {
  if (!metadata) return undefined

  switch (field) {
    case "authors":
    case "languages":
    case "subjects":
    case "formatType":
      return formatList(metadata[field])
    case "date":
      return formatBookMetadataDate(metadata[field])
    case "size":
      // `LinkMetadata.size` is stored as a string; formatBytes also
      // tolerates numbers in case a future provider widens that.
      return formatBytes(metadata[field])
    case "title":
    case "description":
    case "rating":
    case "coverLink":
    case "pageCount":
    case "contentType":
    case "isbn":
    case "publisher":
    case "rights":
    case "modifiedAt":
      return formatScalar(metadata[field])
    default:
      // Adding a field to BOOK_METADATA_FIELDS_BY_SOURCE without a branch
      // here will fail compilation rather than silently render blanks.
      return assertNever(field)
  }
}
