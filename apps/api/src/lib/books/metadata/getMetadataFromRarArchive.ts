import type { FileMetadata } from "@oboku/shared"
import { createArchiveFromNodeUnrarJs } from "@prose-reader/streamer/archives/createArchiveFromNodeUnrarJs"
import type { Extractor } from "node-unrar-js"
import { getMetadataFromArchive } from "./getMetadataFromArchive"

export const getMetadataFromRarArchive = async (
  extractor: Extractor<Uint8Array>,
  contentType: string,
): Promise<FileMetadata> => {
  const archive = await createArchiveFromNodeUnrarJs(extractor)

  return getMetadataFromArchive(archive, contentType)
}
