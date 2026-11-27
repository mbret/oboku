import {
  getFileNameFromContentDisposition,
  getOpdsCredentialHeaders,
  type OpdsBookLinkData,
  type SettingsResolvedConnectorData,
  withReaderFileExtension,
} from "@oboku/shared"
import type { Download } from "../../../http/useDownload"

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
      ) ?? withReaderFileExtension(title, acquisition.type),
  }
}
