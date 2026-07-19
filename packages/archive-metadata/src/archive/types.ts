import {
  type Archive,
  type ArchiveRecord,
  isFileRecord,
} from "@prose-reader/archive-reader"

export type { Archive, ArchiveRecord }
export { isFileRecord }

/** File entry of an {@link Archive} (`dir: false`). */
export type ArchiveFileRecord = Extract<ArchiveRecord, { dir: false }>

/**
 * Walk the archive's records and return the first file matching the
 * predicate, skipping directory entries. Records are addressed by their
 * exact `uri` (same casing, same separators); case-insensitive lookups
 * are the caller's responsibility.
 */
export const findFileRecord = (
  archive: Archive,
  predicate: (record: ArchiveFileRecord) => boolean,
): ArchiveFileRecord | undefined => {
  for (const record of archive.records) {
    if (isFileRecord(record) && predicate(record)) return record
  }

  return undefined
}
