/**
 * Persisted on books and collections (`metadataFetchEnabled`).
 *
 * - `undefined` / `null`: defer to protection (default behaviour).
 * - `true`: user explicitly opted in — always fetch external metadata.
 * - `false`: user explicitly opted out — never fetch external metadata.
 */
export type MetadataFetchOverride = boolean | null | undefined

/**
 * Single source of truth for "should we hit external metadata providers for
 * this item?" — used both client and server side. Only gates third-party
 * provider calls (Google Books, ComicVine, BiblioReads, MangaUpdates, MangaDex,
 * etc.). Local extraction (file cover, archive metadata) and user data sources
 * are not affected.
 */
export const resolveMetadataFetchEnabled = (
  override: MetadataFetchOverride,
  isProtected: boolean,
): boolean => {
  if (override === true || override === false) return override

  return !isProtected
}

/**
 * Persisted on books (`metadataFileDownloadEnabled`).
 *
 * - `undefined` / `null`: defer to default (allowed).
 * - `true`: user explicitly opted in — allow download during metadata refresh.
 * - `false`: user explicitly opted out — never download during metadata refresh.
 */
export type MetadataFileDownloadOverride = boolean | null | undefined

/**
 * Single source of truth for "may we download the book file when refreshing
 * its metadata?" — used by the API metadata pipeline. Defaults to `true`
 * (download allowed) and only returns `false` when the user explicitly opts
 * out. Has no effect on user-initiated downloads (reading the book) or on
 * external metadata provider calls (see {@link resolveMetadataFetchEnabled}).
 */
export const resolveMetadataFileDownloadEnabled = (
  override: MetadataFileDownloadOverride,
): boolean => override !== false
