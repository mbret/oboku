import fs from "node:fs"
import type { Archive } from "@prose-reader/archive-reader"
import { createArchiveFromZipJs } from "@prose-reader/archive-reader/archives/createArchiveFromZipJs"
import { BlobReader, ZipReader } from "@zip.js/zip.js"

const basename = (uri: string): string =>
  uri.split(/[\\/]/).filter(Boolean).pop() ?? uri

/**
 * `fs.openAsBlob` reads the file lazily, so an entry is read and decoded only
 * when it is read.
 */
export const getZipArchive = async (
  filePath: string,
  {
    name = basename(filePath),
    encodingFormat,
  }: { name?: string; encodingFormat?: string } = {},
): Promise<Archive> => {
  const zipReader = new ZipReader(
    new BlobReader(await fs.openAsBlob(filePath)),
    { useWebWorkers: false },
  )

  return createArchiveFromZipJs(zipReader, { name, encodingFormat })
}
