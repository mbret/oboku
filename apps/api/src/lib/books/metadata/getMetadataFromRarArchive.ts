import type { FileMetadata } from "@oboku/shared"
import type { Extractor } from "node-unrar-js"
import { getMetadataFromArchive } from "./getMetadataFromArchive"
import { createUnrarArchiveSource } from "./unrarArchive"

export const getMetadataFromRarArchive = async (
  extractor: Extractor<Uint8Array>,
  contentType: string,
): Promise<FileMetadata> => {
  const archive = createUnrarArchiveSource(extractor)

  return getMetadataFromArchive(archive, contentType)
}
