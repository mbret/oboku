import type { LegacyFileMetadata } from "@oboku/shared"
import { getMetadataFromArchive } from "./getMetadataFromArchive.js"
import { createUnzipperArchiveSource } from "./unzipperArchive.js"

export const getMetadataFromZipArchive = async (
  tmpFilePath: string,
  contentType: string,
): Promise<LegacyFileMetadata> => {
  const archive = await createUnzipperArchiveSource(tmpFilePath)

  try {
    return await getMetadataFromArchive(archive, contentType)
  } finally {
    await archive.close()
  }
}
