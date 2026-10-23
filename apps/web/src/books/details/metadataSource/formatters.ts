import {
  type BookMetadataFields,
  type BOOK_METADATA_FIELDS_BY_SOURCE,
  type ReadonlyBookMetadataFields,
  assertNever,
  formatBytes,
} from "@oboku/shared"

export const formatList = (
  values: readonly string[] | undefined,
): string | undefined => (values?.length ? values.join(", ") : undefined)

export const formatBookMetadataDate = (
  date: ReadonlyBookMetadataFields["date"],
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
 * Names where a cover came from, since the two cases carry very different
 * weight: one is the container's own declaration, the other the first page
 * of an archive that declares none.
 */
export const formatCoverConfidence = (
  coverConfidence: BookMetadataFields["coverConfidence"],
): string | undefined => {
  switch (coverConfidence) {
    case "derived":
      return "Declared by the file"
    case "assumed":
      return "First page"
    default:
      return undefined
  }
}

/**
 * Project a single metadata field into a short human-readable string for
 * caption-style previews. Returns `undefined` when the field is absent or
 * empty so callers can compose preference-ordered fallback lists.
 *
 * Each branch reads `fields[field]` AFTER `field` has been narrowed to a
 * literal, which is what lets TypeScript infer the per-field value type
 * without any casts.
 */
export const formatBookMetadataField = (
  fields: ReadonlyBookMetadataFields | undefined,
  field: BookMetadataFieldKey,
): string | undefined => {
  if (!fields) return undefined

  switch (field) {
    case "authors":
    case "languages":
    case "subjects":
    case "formatType":
      return formatList(fields[field])
    case "date":
      return formatBookMetadataDate(fields[field])
    case "size":
      // `LinkMetadata.size` is stored as a string; formatBytes also
      // tolerates numbers in case a future provider widens that.
      return formatBytes(fields[field])
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
      return formatScalar(fields[field])
    default:
      // Adding a field to BOOK_METADATA_FIELDS_BY_SOURCE without a branch
      // here will fail compilation rather than silently render blanks.
      return assertNever(field)
  }
}
