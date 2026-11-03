import { CBR_MIME_TYPES, getMimeTypeEssence } from "@oboku/shared"

const EXTRACTABLE_CONTENT_TYPES = [
  "application/x-cbz",
  "application/epub+zip",
  "application/zip",
  "application/x-zip-compressed",
  ...CBR_MIME_TYPES,
]

export const isMaybeExtractableContentType = (
  contentType: string | undefined,
) =>
  !contentType ||
  EXTRACTABLE_CONTENT_TYPES.includes(getMimeTypeEssence(contentType))
