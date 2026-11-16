import { linksDownload } from "@oboku/shared"
import type { HttpApiClientWeb } from "../../../http"
import { createWebdavClient } from "./auth/connect"

/** Downloads a link's file through oboku's API, which reads it from the WebDAV server. */
export const downloadThroughServer = async ({
  httpClientApi,
  linkId,
  password,
  signal,
}: {
  httpClientApi: HttpApiClientWeb
  linkId: string
  password: string
  signal: AbortSignal
}) => {
  const { data } = await linksDownload({
    client: httpClientApi.sdkClient,
    body: { linkId, providerCredentials: { password } },
    parseAs: "blob",
    signal,
  })

  // The reader takes a blob's type as the book's format. A download from the
  // WebDAV server gives none, so the reader goes by the file's name: keep it so.
  return new Blob([data])
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
