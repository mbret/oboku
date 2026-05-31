import type { FileMetadata } from "@oboku/shared"
import { createArchiveFromNodeUnrarJs } from "@prose-reader/streamer/archives/createArchiveFromNodeUnrarJs"
import type { Extractor } from "node-unrar-js"
import { getMetadataFromArchive } from "./getMetadataFromArchive"

/**
 * The extractor is owned by the caller (see {@link getRarArchive}) and reused
 * for both metadata parsing and cover binary extraction, so it is never
 * disposed here.
 */
export const getMetadataFromRarArchive = async (
  extractor: Extractor<Uint8Array>,
  contentType: string,
): Promise<FileMetadata> => {
  const archive = await createArchiveFromNodeUnrarJs(extractor)

  return getMetadataFromArchive(archive, contentType)
}
