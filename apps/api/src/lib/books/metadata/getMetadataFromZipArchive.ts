import type { FileMetadata } from "@oboku/shared"
import { getMetadataFromArchive } from "./getMetadataFromArchive"
import { createUnzipperArchiveSource } from "./unzipperArchive"

export const getMetadataFromZipArchive = async (
  tmpFilePath: string,
  contentType: string,
): Promise<FileMetadata> => {
  const archive = await createUnzipperArchiveSource(tmpFilePath)

  try {
    return await getMetadataFromArchive(archive, contentType)
  } finally {
    await archive.close()
  }
}
