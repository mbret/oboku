import {
  type MetadataIdentifierScheme,
  normalizeIsbn,
  type ResolvedMetadata,
} from "@prose-reader/archive-reader"

const isIsbnBearingScheme = (scheme: MetadataIdentifierScheme): boolean =>
  scheme === "ISBN" || scheme === "GTIN"

const isBooklandIsbn = (isbn: string): boolean =>
  isbn.length === 10 || /^97[89]/.test(isbn)

/**
 * The ISBN an archive states, canonicalized to 10 or 13 characters, or
 * `undefined` when it states none.
 *
 * ComicInfo has no ISBN field of its own: it announces one through the broader
 * `GTIN`, which is where {@link patchArchiveMetadata} writes it, so that scheme
 * is read too — but only for Bookland-prefixed values, since the same field
 * also holds plain retail barcodes.
 */
export const archiveMetadataIsbn = (
  metadata: Pick<ResolvedMetadata, "identifiers"> | undefined,
): string | undefined => {
  for (const { value, scheme } of metadata?.identifiers ?? []) {
    if (!isIsbnBearingScheme(scheme)) continue

    const isbn = normalizeIsbn(value)

    if (isbn !== undefined && isBooklandIsbn(isbn)) return isbn
  }

  return undefined
}
