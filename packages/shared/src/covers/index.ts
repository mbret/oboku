import { type BookMetadata, isBookMetadataSource } from "../metadata"

/**
 * Object key under which a user's book cover image is stored in the
 * bucket. Stable for the lifetime of the (user, book) pair.
 */
export const getBookCoverKey = (userNameHex: string, bookId: string) =>
  `cover-${userNameHex}-${bookId}`

/**
 * Opaque, deterministic identity of a book cover image. The format is
 * `<type>:<encodeURIComponent(value)>` so:
 *  - `<type>` is read with a prefix check when callers only need to know
 *    "is the bucket image from a file source?" without parsing the value
 *    (no metadata `type` contains `:`).
 *  - `<value>` is escaped with `encodeURIComponent` to keep arbitrary
 *    URLs/paths/UTF-8 bytes safe inside the key without inventing our
 *    own escaping rules.
 *
 * Equality is the only operation `updateCover` performs on the key — the
 * bucket image is considered up to date iff
 * `book.bucketCoverKey === buildBookBucketCoverKey({ type, value })`.
 *
 * Encoding is intentionally runtime-agnostic (no `Buffer`/`btoa`) so the
 * same helper can run on the web client and the node API.
 *
 * Named with the `Book` prefix to match {@link getBookCoverKey} and to
 * leave room for an analogous `buildCollectionBucketCoverKey` if/when
 * collections grow the same identity-tracking concern.
 */
export const buildBookBucketCoverKey = ({
  type,
  value,
}: {
  type: BookMetadata["type"]
  value: string
}): string => `${type}:${encodeURIComponent(value)}`

/**
 * Read just the source-`type` portion of a book cover key without
 * decoding the value. Returns `undefined` when the key is malformed (no
 * `:` separator, empty type prefix, or an unknown source name from a
 * hand-edit / older format) so callers can treat the bucket identity as
 * "unknown" and fall back to a re-upload, rather than crashing or
 * silently widening the caller's exhaustive `BookMetadata["type"]`
 * switch with a non-existent variant.
 */
export const getBookBucketCoverKeyType = (
  key: string,
): BookMetadata["type"] | undefined => {
  const idx = key.indexOf(":")
  if (idx <= 0) return undefined
  const prefix = key.slice(0, idx)

  return isBookMetadataSource(prefix) ? prefix : undefined
}
