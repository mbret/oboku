import JSZip from "jszip"
import type { Archive } from "@oboku/archive-metadata"
import { createArchiveFromJszip } from "@prose-reader/streamer/archives/createArchiveFromJszip"

export const loadArchive = async (
  file: Blob | File,
): Promise<{ zip: JSZip; archive: Archive }> => {
  const zip = await JSZip.loadAsync(file)
  const archive = await createArchiveFromJszip(zip)

  return { zip, archive }
}
