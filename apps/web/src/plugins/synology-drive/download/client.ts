import {
  httpClientWeb,
  isXMLHttpResponseError,
} from "../../../http/httpClient.web"
import {
  getSynologyDriveBrowseItem,
  getSynologyDriveDownloadUrls,
  type SynologyDriveSession,
} from "../client"

const isJsonContentType = (contentType: string | null | undefined) =>
  !!contentType && contentType.toLowerCase().includes("json")

const extractDownloadError = async (blob: Blob) => {
  const response = JSON.parse(await blob.text()) as {
    error?: {
      code?: number
    }
    success?: boolean
  }

  if (response.success === false) {
    throw new Error(
      `Synology Drive download failed${response.error?.code ? ` (${response.error.code})` : ""}.`,
    )
  }

  throw new Error("Synology Drive returned JSON instead of file data.")
}

const downloadBlobFromUrl = async ({
  onDownloadProgress,
  signal,
  url,
}: {
  onDownloadProgress: (progress: number) => void
  signal: AbortSignal
  url: string
}) => {
  const response = await httpClientWeb.download<Blob>({
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

  if (isJsonContentType(contentType)) {
    await extractDownloadError(response.data)
  }

  return {
    data: response.data,
  }
}

export const downloadSynologyDriveBlob = async ({
  fileId,
  onDownloadProgress,
  session,
  signal,
}: {
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
