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
