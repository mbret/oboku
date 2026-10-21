import type { Archive } from "@prose-reader/archive-reader"
import { createArchiveFromUnzipper } from "@prose-reader/archive-reader/archives/createArchiveFromUnzipper"
import unzipper from "unzipper"

const basename = (uri: string): string =>
  uri.split(/[\\/]/).filter(Boolean).pop() ?? uri

/**
 * Adapt a zip file on disk to a prose-reader {@link Archive}.
 * `unzipper.Open.file` gives random access through the central directory, so
 * an entry is decoded only when it is read.
 */
export const createUnzipperArchiveSource = async (
  filePath: string,
): Promise<Archive> => {
  const directory = await unzipper.Open.file(filePath)

  return createArchiveFromUnzipper(directory, { name: basename(filePath) })
}
