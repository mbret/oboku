import type { FileMetadata } from "@oboku/shared"
import {
  type Archive,
  identifierValue,
  mainTitle,
  resolveArchive,
} from "@prose-reader/archive-reader"
import { Logger } from "@nestjs/common"

const logger = new Logger("getMetadataFromArchive")

export const getMetadataFromArchive = async (
  archive: Archive,
  contentType: string,
): Promise<FileMetadata> => {
  const { metadata, unreadableSources } = await resolveArchive(archive, {
    include: ["metadata"],
  })

  const hasTitle = mainTitle(metadata) !== undefined
  const hasIsbn = identifierValue(metadata.identifiers, "ISBN") !== undefined
  const hasGoogleVolumeId =
    identifierValue(metadata.identifiers, "GoogleBooks") !== undefined

  logger.log(
    `Extracted archive metadata (title=${hasTitle}, isbn=${hasIsbn}, googleVolumeId=${hasGoogleVolumeId}, cover=${metadata.cover !== undefined})`,
  )

  if (unreadableSources.length > 0) {
    logger.warn(
      `Archive carries metadata sources it cannot parse: ${unreadableSources.join(", ")}`,
    )
  }

  return { type: "file", contentType, metadata }
}
