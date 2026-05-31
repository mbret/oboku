import JSZip from "jszip"
import type { Archive } from "@oboku/archive-metadata"
import { createArchiveFromJszip } from "@prose-reader/streamer/archives/createArchiveFromJszip"

/**
 * Loads a book archive into JSZip.
 *
 * Memory note: `JSZip.loadAsync` reads the entire `file` once via
 * `FileReader.readAsArrayBuffer` into its own internal `Uint8Array`; the zip
 * entries reference that copy, not the original `Blob`/`File`. JSZip therefore
 * does not retain `file` past this call, so callers should avoid holding the
 * `file` reference afterwards (capture `name`/`type` up front instead) to let
 * the engine reclaim its backing bytes during later processing. Two full-size
 * copies still coexist transiently while the read is in flight.
 */
export const loadArchive = async (
  file: Blob | File,
): Promise<{ zip: JSZip; archive: Archive }> => {
  const zip = await JSZip.loadAsync(file)
  const archive = await createArchiveFromJszip(zip)

  return { zip, archive }
}
