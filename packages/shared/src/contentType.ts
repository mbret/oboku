export const getUrlExtension = (url: string) => {
  return url.split(/[#?]/)[0]?.split(`.`).pop()?.trim() || ``
}

export const READER_ACCEPTED_FILE_TYPES = {
  "text/plain": [".txt"],
  "application/x-cbz": [".cbz"],
  "application/zip": [".epub", ".zip"],
  "application/x-zip-compressed": [".epub", ".zip"],
  "application/epub+zip": [".epub", ".zip"],
  "application/x-cbr": [".cbr"],
  "application/x-rar": [".cbr"],
  "application/pdf": [".pdf"],
}

export const isPotentialZipFile = ({
  name,
  mimeType,
}: {
  name?: string | null
  mimeType?: string | null
}) => {
  const normalizedName = name?.toLowerCase()

  return (
    normalizedName?.endsWith(".zip") ||
    normalizedName?.endsWith(".epub") ||
    normalizedName?.endsWith(".cbz") ||
    mimeType?.startsWith("application/zip") ||
    mimeType?.startsWith("application/x-zip-compressed") ||
    mimeType?.startsWith("application/x-cbz") ||
    mimeType?.startsWith("application/epub+zip")
  )
}

export const READER_ACCEPTED_MIME_TYPES = Object.keys(
  READER_ACCEPTED_FILE_TYPES,
)

export const READER_ACCEPTED_EXTENSIONS = Object.values(
  READER_ACCEPTED_FILE_TYPES,
).flat()

export const isFileSupported = ({
  mimeType,
  name,
}: {
  name?: string | null
  mimeType?: string | null
}) => {
  const extension = `.${getUrlExtension(name || "")}`

  return (
    READER_ACCEPTED_EXTENSIONS.includes(extension) ||
    READER_ACCEPTED_MIME_TYPES.includes(mimeType ?? "")
  )
}
