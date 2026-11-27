import { linksDownload } from "@oboku/shared"
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

  return new Response(body, { headers: response.headers }).blob()
}

/** @param password the connector's, for a WebDAV or OPDS link. */
export const downloadThroughServerProxy = async ({
  httpClientApi,
  linkId,
  password,
  onDownloadProgress,
  signal,
}: {
  httpClientApi: HttpApiClientWeb
  linkId: string
  password?: string
  onDownloadProgress: (progress: number) => void
  signal: AbortSignal
}) => {
  const { response } = await linksDownload({
    client: httpClientApi.sdkClient,
    body: {
      linkId,
      ...(password !== undefined && { providerCredentials: { password } }),
    },
    parseAs: "stream",
    signal,
  })

  return readBlobReportingProgress({ response, onDownloadProgress })
}
