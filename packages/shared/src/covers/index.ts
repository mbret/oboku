import type { BookMetadata } from "../metadata"

/**
 * Object key under which a user's book cover image is stored in the
 * bucket. Stable for the lifetime of the (user, book) pair.
 */
export const getBookCoverKey = (userNameHex: string, bookId: string) =>
  `cover-${userNameHex}-${bookId}`

/**
 * Opaque, deterministic identity of a book cover image. The format is
 * `<type>:<encodeURIComponent(value)>`: `<value>` is escaped with
 * `encodeURIComponent` to keep arbitrary URLs/paths/UTF-8 bytes safe
 * inside the key without inventing our own escaping rules.
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
