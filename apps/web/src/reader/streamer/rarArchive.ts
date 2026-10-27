import { createArchiveFromLibArchive } from "@prose-reader/archive-reader/archives/createArchiveFromLibArchive"
import { Archive as LibArchive } from "libarchive.js"
import type { getBookFile } from "../../download/getBookFile.shared"
import { getEncodingFormat } from "./archives.shared"

/**
 * Does not work within service worker context yet.
 * Library use XhtmlHttpRequest which exist in worker and main thread but not SW.
 * We fallback to app main thread for rar archives
 */
export const getArchiveForRarFile = async (
  file: NonNullable<Awaited<ReturnType<typeof getBookFile>>>,
) => {
  const archive = await LibArchive.open(file.data)

  return createArchiveFromLibArchive(archive, {
    orderByAlpha: true,
    name: file.data.name,
    encodingFormat: getEncodingFormat(file),
  })
}
