import {
  type Archive,
  type ArchiveRecord,
  isFileRecord,
} from "@prose-reader/archive-reader"

export type { Archive, ArchiveRecord }
export { isFileRecord }

/** File entry of an {@link Archive} (`dir: false`). */
export type ArchiveFileRecord = Extract<ArchiveRecord, { dir: false }>
