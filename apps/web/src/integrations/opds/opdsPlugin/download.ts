import {
  getFileNameFromContentDisposition,
  getOpdsCredentialHeaders,
  type OpdsBookLinkData,
  READER_ACCEPTED_FILE_TYPES,
  type SettingsResolvedConnectorData,
} from "@oboku/shared"
import { downloadThroughServerProxy } from "../../../connectors/downloadThroughServerProxy"
import type { HttpApiClientWeb } from "../../../http"
import type { Download } from "../../../http/useDownload"

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

const toTitleFileName = ({
  title,
  acquisition,
}: Pick<OpdsBookLinkData, "title" | "acquisition">) =>
  `${title}${toFileExtension(acquisition.type)}`

export const downloadOpdsBook = async ({
  acquisition,
  title,
  connector,
  download,
  onDownloadProgress,
  signal,
}: {
  acquisition: OpdsBookLinkData["acquisition"]
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
      ) ?? toTitleFileName({ title, acquisition }),
  }
}

/**
 * Downloads an OPDS book through oboku's server. The file is named after the
 * book's title: the browser cannot read the `Content-Disposition` of oboku's
 * answer.
 */
export const downloadOpdsBookThroughServer = async ({
  httpClientApi,
  linkId,
  password,
  acquisition,
  title,
  onDownloadProgress,
  signal,
}: {
  httpClientApi: HttpApiClientWeb
  linkId: string
  password: string
  acquisition: OpdsBookLinkData["acquisition"]
  title: string
  onDownloadProgress: (progress: number) => void
  signal: AbortSignal
}) => ({
  data: await downloadThroughServerProxy({
    httpClientApi,
    linkId,
    password,
    onDownloadProgress,
    signal,
  }),
  fileName: toTitleFileName({ title, acquisition }),
})
