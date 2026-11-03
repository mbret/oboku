import { MIME_TYPE_FOLDER } from "./constants"

export const isFolder = (file: { mimeType?: string }) =>
  file.mimeType === MIME_TYPE_FOLDER
