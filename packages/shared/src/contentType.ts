import { getUriExtension } from "@prose-reader/shared"

export const getMimeTypeEssence = (mimeType: string) =>
  mimeType.split(";")[0]?.trim().toLowerCase() ?? ""

export const ZIP_MIME_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
  "application/epub+zip",
  "application/x-cbz",
  "application/vnd.comicbook+zip",
  // Nextcloud's type for .cbz files
  "application/comicbook+zip",
]

export const ZIP_EXTENSIONS = [".epub", ".zip", ".cbz"]

const ZIP_FILE_TYPES = Object.fromEntries(
  ZIP_MIME_TYPES.map((mimeType): [string, string[]] => [
    mimeType,
    ZIP_EXTENSIONS,
  ]),
)

export const RAR_MIME_TYPES = [
  "application/vnd.rar",
  "application/x-rar-compressed",
  "application/x-rar",
  "application/vnd.comicbook-rar",
  // Nextcloud's type for .cbr files
  "application/comicbook+rar",
]

export const CBR_MIME_TYPES = [
  ...RAR_MIME_TYPES,
  // Apache's type for .cbr, .cba, .cbt, .cbz and .cb7 files
  "application/x-cbr",
]

export const CBR_EXTENSIONS = [".cbr", ".rar"]

const CBR_FILE_TYPES = Object.fromEntries(
  CBR_MIME_TYPES.map((mimeType): [string, string[]] => [
    mimeType,
    CBR_EXTENSIONS,
  ]),
)

export const READER_ACCEPTED_FILE_TYPES = {
  "text/plain": [".txt"],
  ...ZIP_FILE_TYPES,
  ...CBR_FILE_TYPES,
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
    ZIP_EXTENSIONS.some((extension) => normalizedName?.endsWith(extension)) ||
    ZIP_MIME_TYPES.includes(getMimeTypeEssence(mimeType ?? ""))
  )
}

export const READER_ACCEPTED_MIME_TYPES = Object.keys(
  READER_ACCEPTED_FILE_TYPES,
)

export const READER_ACCEPTED_EXTENSIONS = [
  ...new Set(Object.values(READER_ACCEPTED_FILE_TYPES).flat()),
]

export const hasReaderAcceptedExtension = (fileName: string) =>
  READER_ACCEPTED_EXTENSIONS.includes(
    `.${getUriExtension(fileName).toLowerCase()}`,
  )

type ReaderAcceptedType = keyof typeof READER_ACCEPTED_FILE_TYPES

const isReaderAcceptedType = (type: string): type is ReaderAcceptedType =>
  Object.hasOwn(READER_ACCEPTED_FILE_TYPES, type)

/**
 * The extension named in `mimeType` (`.epub` for application/epub+zip), or
 * else its first, and "" for a type the reader does not accept.
 */
const toReaderFileExtension = (mimeType: string) => {
  const essence = getMimeTypeEssence(mimeType)

  if (!isReaderAcceptedType(essence)) return ""

  const extensions = READER_ACCEPTED_FILE_TYPES[essence]

  return (
    extensions.find((extension) => essence.includes(extension.slice(1))) ??
    extensions[0] ??
    ""
  )
}

export const withReaderFileExtension = (
  fileName: string,
  mimeType: string | undefined,
) =>
  hasReaderAcceptedExtension(fileName)
    ? fileName
    : `${fileName}${toReaderFileExtension(mimeType ?? "")}`

export const isFileSupported = ({
  mimeType,
  name,
}: {
  name?: string | null
  mimeType?: string | null
}) =>
  hasReaderAcceptedExtension(name ?? "") ||
  READER_ACCEPTED_MIME_TYPES.includes(getMimeTypeEssence(mimeType ?? ""))
