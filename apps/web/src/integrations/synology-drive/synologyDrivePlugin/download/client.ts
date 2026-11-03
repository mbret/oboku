import {
  isSynologyDriveDownloadErrorContentType,
  parseSynologyDriveDownloadErrorPayload,
} from "@oboku/synology"
import { isXMLHttpResponseError } from "../../../../http/httpClient.web"
import type { Download } from "../../../../http/useDownload"
import {
  getSynologyDriveBrowseItem,
  getSynologyDriveDownloadUrls,
  type SynologyDriveSession,
} from "../client"

const tryParseDownloadErrorPayload = (payload: unknown) => {
  try {
    return parseSynologyDriveDownloadErrorPayload(payload)
  } catch {
    return undefined
  }
}

const throwDownloadError = async (blob: Blob) => {
  const payload = tryParseDownloadErrorPayload(JSON.parse(await blob.text()))

  if (payload?.success === false) {
    throw new Error(
      `Synology Drive download failed${payload.error?.code ? ` (${payload.error.code})` : ""}.`,
    )
  }

  throw new Error("Synology Drive returned JSON instead of file data.")
}

const downloadBlobFromUrl = async ({
  download,
  onDownloadProgress,
  signal,
  url,
}: {
  download: Download
  onDownloadProgress: (progress: number) => void
  signal: AbortSignal
  url: string
}) => {
  const response = await download({
    headers: {
      Accept: "application/octet-stream",
    },
    onDownloadProgress: (event) => {
      onDownloadProgress(
        event.lengthComputable && event.total > 0
          ? event.loaded / event.total
          : 0,
      )
    },
    responseType: "blob",
    signal,
    url,
  })

  const contentType = response.headers["content-type"] ?? response.data.type

  if (isSynologyDriveDownloadErrorContentType(contentType)) {
    await throwDownloadError(response.data)
  }

  return {
    data: response.data,
  }
}

export const downloadSynologyDriveBlob = async ({
  download,
  fileId,
  onDownloadProgress,
  session,
  signal,
}: {
  download: Download
  fileId: string
  onDownloadProgress: (progress: number) => void
  session: SynologyDriveSession
  signal: AbortSignal
}) => {
  const urls = getSynologyDriveDownloadUrls({
    fileId,
    session,
  })
  const fileName =
    (
      await getSynologyDriveBrowseItem({
        fileId,
        session,
      })
    ).name.trim() || fileId

  let lastError: unknown

  for (const url of urls) {
    try {
      const result = await downloadBlobFromUrl({
        download,
        onDownloadProgress,
        signal,
        url,
      })

      return {
        ...result,
        fileName,
      }
    } catch (error) {
      lastError = error

      if (isXMLHttpResponseError(error) && error.status === 404) {
        continue
      }

      throw error
    }
  }

  throw lastError ?? new Error("Synology Drive download failed.")
}
