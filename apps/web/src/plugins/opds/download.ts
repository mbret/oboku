import {
  getFileNameFromContentDisposition,
  getOpdsCredentialHeaders,
  type OpdsLinkData,
  READER_ACCEPTED_FILE_TYPES,
  type SettingsResolvedConnectorData,
} from "@oboku/shared"
import type { Download } from "../../http/useDownload"

type ReaderAcceptedType = keyof typeof READER_ACCEPTED_FILE_TYPES

const isReaderAcceptedType = (type: string): type is ReaderAcceptedType =>
  Object.hasOwn(READER_ACCEPTED_FILE_TYPES, type)

/** The extension named in the type (`.epub` for application/epub+zip), or else its first. */
const toFileExtension = (type: string) => {
  if (!isReaderAcceptedType(type)) return ""

  const extensions = READER_ACCEPTED_FILE_TYPES[type]

  return (
    extensions.find((extension) => type.includes(extension.slice(1))) ??
    extensions[0] ??
    ""
  )
}

export const downloadOpdsBook = async ({
  acquisition,
  title,
  connector,
  download,
  onDownloadProgress,
  signal,
}: {
  acquisition: NonNullable<OpdsLinkData["acquisition"]>
  title: string
  connector: SettingsResolvedConnectorData<"opds">
  download: Download
  onDownloadProgress: (progress: number) => void
  signal: AbortSignal
}) => {
  const response = await download({
    url: acquisition.href,
    headers: getOpdsCredentialHeaders(acquisition.href, connector),
    onDownloadProgress: function reportDownloadProgress(event) {
      onDownloadProgress(
        event.lengthComputable && event.total > 0
          ? event.loaded / event.total
          : 0,
      )
    },
    responseType: "blob",
    signal,
  })

  return {
    data: response.data,
    fileName:
      getFileNameFromContentDisposition(
        response.headers["content-disposition"],
      ) ?? `${title}${toFileExtension(acquisition.type)}`,
  }
}
