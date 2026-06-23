import type { Archive } from "@oboku/archive-metadata"
import { createArchiveFromUnzipper } from "@prose-reader/streamer/archives/createArchiveFromUnzipper"
import unzipper from "unzipper"

const basename = (uri: string): string =>
  uri.split(/[\\/]/).filter(Boolean).pop() ?? uri

/**
 * Adapt a zip file on disk to the {@link Archive} interface consumed by
 * `@oboku/archive-metadata`, via prose-reader's `createArchiveFromUnzipper`.
 * `unzipper.Open.file` gives random-access through the central directory,
 * so entries stay lazily decoded — the metadata package only touches the
 * handful it needs (OPF, ComicInfo.xml) and the rest remain on disk.
 */
export const createUnzipperArchiveSource = async (
  filePath: string,
): Promise<Archive> => {
  const directory = await unzipper.Open.file(filePath)

  return createArchiveFromUnzipper(directory, { name: basename(filePath) })
}
