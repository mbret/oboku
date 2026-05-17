import {
  type ArchiveEntry,
  type ArchiveSource,
  findEntry,
} from "../archive/types"

/**
 * Locate the first `*.opf` file inside the archive. EPUBs put it behind
 * the `META-INF/container.xml` manifest but in practice the filename
 * extension is specific enough to pick the package document directly.
 */
export const findOpfEntry = (
  source: ArchiveSource,
): Promise<ArchiveEntry | undefined> =>
  findEntry(source, (entry) => entry.path.toLowerCase().endsWith(".opf"))
