import { getFileNameFromContentDisposition, linksDownload } from "@oboku/shared"
import type { HttpApiClientWeb } from "../http"

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

  // The reader takes a blob's type as the book's format, and goes by the file's
  // name without one. oboku's server names the file with the extension of its
  // type, so the type is left out and the name decides.
  return new Response(body).blob()
}

/**
 * @param password the connector's, for a WebDAV or OPDS link.
 * @param fallbackFileName the name when oboku's server gives none, as a server
 * older than the app does.
 */
export const downloadThroughServerProxy = async ({
  httpClientApi,
  linkId,
  password,
  fallbackFileName,
  onDownloadProgress,
  signal,
}: {
  httpClientApi: HttpApiClientWeb
  linkId: string
  password: string
  fallbackFileName: string
  onDownloadProgress: (progress: number) => void
  signal: AbortSignal
}) => {
  const { response } = await linksDownload({
    client: httpClientApi.sdkClient,
    body: { linkId, providerCredentials: { password } },
    parseAs: "stream",
    signal,
  })
  const fileName =
    getFileNameFromContentDisposition(
      response.headers.get("Content-Disposition") ?? undefined,
    ) ?? fallbackFileName

  return {
    data: await readBlobReportingProgress({ response, onDownloadProgress }),
    fileName,
  }
}
