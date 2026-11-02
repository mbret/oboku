import { type FileMetadata, getBookMetadataFields } from "@oboku/shared"
import { type Archive, resolveArchive } from "@prose-reader/archive-reader"
import { Logger } from "@nestjs/common"

const logger = new Logger("getMetadataFromArchive")

export const getMetadataFromArchive = async (
  archive: Archive,
): Promise<FileMetadata> => {
  const { metadata, mediaType, unreadableSources } = await resolveArchive(
    archive,
    { include: ["metadata"] },
  )
  const fileMetadata: FileMetadata = {
    type: "file",
    contentType: mediaType,
    metadata,
  }
  const { title, isbn, googleVolumeId, coverLink } =
    getBookMetadataFields(fileMetadata)

  logger.log(
    `Extracted archive metadata (title=${title !== undefined}, isbn=${isbn !== undefined}, googleVolumeId=${googleVolumeId !== undefined}, cover=${coverLink !== undefined})`,
  )

  if (unreadableSources.length > 0) {
    logger.warn(
      `Archive carries metadata sources it cannot parse: ${unreadableSources.join(", ")}`,
    )
  }

  return fileMetadata
}
