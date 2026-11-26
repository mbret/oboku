import { linksDownload } from "@oboku/shared"
import type { HttpApiClientWeb } from "../../../http"
import { createWebdavClient } from "./auth/connect"

const createProgressReporter = ({
  totalBytes,
  onDownloadProgress,
}: {
  totalBytes: number
  onDownloadProgress: (progress: number) => void
}) => {
  let receivedBytes = 0

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      receivedBytes += chunk.byteLength
      onDownloadProgress(receivedBytes / totalBytes)
      controller.enqueue(chunk)
    },
  })
}

const readBlobReportingProgress = ({
  response,
  onDownloadProgress,
}: {
  response: Response
  onDownloadProgress: (progress: number) => void
}) => {
  const totalBytes = Number(response.headers.get("Content-Length"))
  const isTotalSizeKnown = totalBytes > 0
  const body = isTotalSizeKnown
    ? response.body?.pipeThrough(
        createProgressReporter({ totalBytes, onDownloadProgress }),
      )
    : response.body

  // The reader takes a blob's type as the book's format. A download from the
  // WebDAV server gives none, so the reader goes by the file's name: keep it so.
  return new Response(body).blob()
}

/** Downloads a link's file through oboku's API, which reads it from the WebDAV server. */
export const downloadThroughServerProxy = async ({
  httpClientApi,
  linkId,
  password,
  onDownloadProgress,
  signal,
}: {
  httpClientApi: HttpApiClientWeb
  linkId: string
  password: string
  onDownloadProgress: (progress: number) => void
  signal: AbortSignal
}) => {
  const { response } = await linksDownload({
    client: httpClientApi.sdkClient,
    body: { linkId, providerCredentials: { password } },
    parseAs: "stream",
    signal,
  })

  return readBlobReportingProgress({ response, onDownloadProgress })
}

export const downloadFromWebdavServer = async ({
  url,
  username,
  password,
  filePath,
  signal,
}: {
  url: string
  username: string
  password: string
  filePath: string
  signal: AbortSignal
}) => {
  const client = createWebdavClient({ url, username, password })
  const content = await client.getFileContents(filePath, {
    format: "binary",
    signal,
  })

  if (!(content instanceof ArrayBuffer)) {
    throw new Error("Unknown data type")
  }

  return new Blob([content])
}
