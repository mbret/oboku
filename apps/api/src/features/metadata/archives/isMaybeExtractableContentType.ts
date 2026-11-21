import {
  CBR_MIME_TYPES,
  ZIP_MIME_TYPES,
  getMimeTypeEssence,
} from "@oboku/shared"

const EXTRACTABLE_CONTENT_TYPES = [...ZIP_MIME_TYPES, ...CBR_MIME_TYPES]

export const isMaybeExtractableContentType = (
  contentType: string | undefined,
) =>
  !contentType ||
  EXTRACTABLE_CONTENT_TYPES.includes(getMimeTypeEssence(contentType))
