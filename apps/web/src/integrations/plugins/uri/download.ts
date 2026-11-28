import {
  getFileNameFromContentDisposition,
  getFileNameFromUrl,
} from "@oboku/shared"
import type { Download } from "../../../http/useDownload"

export const toUrlFileName = (url: string) => getFileNameFromUrl(url) ?? url

export const downloadFromWebAddress = async ({
  url,
  download,
  onDownloadProgress,
  signal,
}: {
  url: string
  download: Download
  onDownloadProgress: (progress: number) => void
  signal: AbortSignal
}) => {
  const response = await download({
    responseType: "blob",
    signal,
    url,
    onDownloadProgress: function reportDownloadProgress(event) {
      onDownloadProgress(event.loaded / (event.total ?? 1))
    },
  })

  return {
    data: response.data,
    fileName:
      getFileNameFromContentDisposition(
        response.headers["content-disposition"],
      ) ?? toUrlFileName(url),
  }
}
