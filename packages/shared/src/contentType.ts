export const getUrlExtension = (url: string) => {
  return url.split(/[#?]/)[0]?.split(`.`).pop()?.trim() || ``
}

export const READER_ACCEPTED_EXTENSIONS = {
  "text/plain": [".txt"],
  "application/x-cbz": [".cbz"],
  "application/zip": [".epub", ".zip"],
  "application/x-zip-compressed": [".epub", ".zip"],
  "application/epub+zip": [".epub", ".zip"],
  "application/x-cbr": [".cbr"],
  "application/x-rar": [".cbr"]
}

export const READER_SUPPORTED_MIME_TYPES = Object.keys(
  READER_ACCEPTED_EXTENSIONS
)

export const READER_SUPPORTED_EXTENSIONS = Object.values(
  READER_ACCEPTED_EXTENSIONS
).reduce((prev, next) => [...prev, ...next], [])

export const isFileSupported = ({
  mimeType,
  name
}: {
  name?: string | null
  mimeType?: string | null
}) => {
  const extension = `.${getUrlExtension(name || "")}`

  return (
    READER_SUPPORTED_EXTENSIONS.includes(extension) ||
    READER_SUPPORTED_MIME_TYPES.includes(mimeType ?? "")
  )
}
