import {
  CBR_EXTENSIONS,
  CBR_MIME_TYPES,
  ZIP_EXTENSIONS,
  ZIP_MIME_TYPES,
  getMimeTypeEssence,
} from "@oboku/shared"

const ARCHIVE_CONTENT_TYPES = [...ZIP_MIME_TYPES, ...CBR_MIME_TYPES]

const ARCHIVE_EXTENSIONS = [...ZIP_EXTENSIONS, ...CBR_EXTENSIONS]

const UNSTATED_CONTENT_TYPES = ["", "application/octet-stream"]

const isArchiveContentType = (contentType: string | undefined) =>
  ARCHIVE_CONTENT_TYPES.includes(getMimeTypeEssence(contentType ?? ""))

/**
 * Whether a file may be an archive to read metadata from: its type is an
 * archive's, its source states no type, or its name ends in an archive's
 * extension whatever type its source gives.
 */
export const isMaybeExtractableFile = ({
  contentType,
  name,
}: {
  contentType: string | undefined
  name: string | undefined
}) => {
  const isContentTypeUnstated = UNSTATED_CONTENT_TYPES.includes(
    getMimeTypeEssence(contentType ?? ""),
  )
  const normalizedName = name?.toLowerCase()
  const hasArchiveExtension = ARCHIVE_EXTENSIONS.some((extension) =>
    normalizedName?.endsWith(extension),
  )

  return (
    isArchiveContentType(contentType) ||
    isContentTypeUnstated ||
    hasArchiveExtension
  )
}
