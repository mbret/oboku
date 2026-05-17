/**
 * Minimal, runtime-agnostic archive abstraction the `@oboku/archive-metadata`
 * readers and writers consume. Each runtime (Node/unzipper, browser/JSZip,
 * …) supplies a thin adapter that plugs into these interfaces; none of
 * the archive libraries bleed into the pure format code.
 *
 * Design notes:
 *  - Entries are addressed by their *exact* path inside the archive (same
 *    casing, same separators). Case-insensitive lookups are the caller's
 *    responsibility — see `findEntry` for the canonical pattern.
 *  - `readAsString` vs `readAsUint8Array` both have to be supported: XML
 *    bodies need UTF-8 decoding while covers are binary. Adapters are
 *    free to decode lazily; formats code never assumes memoization.
 */
export type ArchiveEntry = {
  /**
   * Path inside the archive, as reported by the underlying zip library.
   * Always normalized to forward slashes; never starts with `./` or `/`.
   */
  path: string
  /** `true` for directory entries, which have no meaningful bytes. */
  isDir: boolean
  /**
   * Uncompressed size in bytes when the adapter can surface it cheaply;
   * otherwise `undefined`. Readers may use this to short-circuit before
   * fully decoding a large entry.
   */
  size?: number
  readAsString(): Promise<string>
  readAsUint8Array(): Promise<Uint8Array>
}

export type ArchiveSource = {
  /**
   * Snapshot of every entry in the archive. Adapters are expected to
   * materialize the full list eagerly — streaming-only adapters should
   * buffer into memory once before returning.
   */
  listEntries(): Promise<ArchiveEntry[]>
}

/**
 * Convenience lookup that adapters don't need to reimplement. Walks the
 * entry list with a predicate and returns the first match, skipping
 * directory entries.
 */
export const findEntry = async (
  source: ArchiveSource,
  predicate: (entry: ArchiveEntry) => boolean,
): Promise<ArchiveEntry | undefined> => {
  const entries = await source.listEntries()

  return entries.find((entry) => !entry.isDir && predicate(entry))
}
