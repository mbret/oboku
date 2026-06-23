import {
  type Archive,
  type ArchiveFileRecord,
  findFileRecord,
} from "../archive/types"

/**
 * Locate the first `*.opf` file inside the archive. EPUBs put it behind
 * the `META-INF/container.xml` manifest but in practice the filename
 * extension is specific enough to pick the package document directly.
 */
export const findOpfEntry = (archive: Archive): ArchiveFileRecord | undefined =>
  findFileRecord(archive, (record) => record.uri.toLowerCase().endsWith(".opf"))
