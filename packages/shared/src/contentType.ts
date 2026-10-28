export const getUrlExtension = (url: string) => {
  return url.split(/[#?]/)[0]?.split(`.`).pop()?.trim() || ``
}

/**
 * The type and subtype of `mimeType`, lowercased, without its parameters
 * (https://mimesniff.spec.whatwg.org/#mime-type-essence).
 */
export const getMimeTypeEssence = (mimeType: string) =>
  mimeType.split(";")[0]?.trim().toLowerCase() ?? ""

/**
 * Types sources give CBR files, including Nextcloud's
 * `application/comicbook+rar` and the generic RAR types.
 */
export const CBR_MIME_TYPES = [
  "application/vnd.comicbook-rar",
  "application/x-cbr",
  "application/comicbook+rar",
  "application/vnd.rar",
  "application/x-rar-compressed",
  "application/x-rar",
]

const RAR_FILE_TYPES = Object.fromEntries(
  CBR_MIME_TYPES.map((mimeType): [string, string[]] => [
    mimeType,
    [".cbr", ".rar"],
  ]),
)

export const READER_ACCEPTED_FILE_TYPES = {
  "text/plain": [".txt"],
  "application/x-cbz": [".cbz"],
  "application/zip": [".epub", ".zip"],
  "application/x-zip-compressed": [".epub", ".zip"],
  "application/epub+zip": [".epub", ".zip"],
  ...RAR_FILE_TYPES,
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
  const extension = `.${getUrlExtension(name || "").toLowerCase()}`

  return (
    READER_ACCEPTED_EXTENSIONS.includes(extension) ||
    READER_ACCEPTED_MIME_TYPES.includes(getMimeTypeEssence(mimeType ?? ""))
  )
}
