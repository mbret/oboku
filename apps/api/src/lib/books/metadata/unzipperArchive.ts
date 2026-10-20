import type { Archive } from "@prose-reader/archive-reader"
import { createArchiveFromUnzipper } from "@prose-reader/archive-reader/archives/createArchiveFromUnzipper"
import unzipper from "unzipper"

const basename = (uri: string): string =>
  uri.split(/[\\/]/).filter(Boolean).pop() ?? uri

/**
 * Adapt a zip file on disk to the {@link Archive} interface that
 * prose-reader's `resolveArchive` consumes, via `createArchiveFromUnzipper`.
 * `unzipper.Open.file` gives random-access through the central directory,
 * so entries stay lazily decoded. `resolveArchive` only reads the handful it
 * needs (OPF, ComicInfo.xml, Apple/Kobo display options) and the rest remain
 * on disk.
 */
export const createUnzipperArchiveSource = async (
  filePath: string,
): Promise<Archive> => {
  const directory = await unzipper.Open.file(filePath)

  return createArchiveFromUnzipper(directory, { name: basename(filePath) })
}
