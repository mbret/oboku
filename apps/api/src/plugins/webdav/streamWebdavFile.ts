import type { WebdavConnectorDocType } from "@oboku/shared"
import { toByteCount } from "../../http/contentLength.js"
import {
  FileSizeUnstatedError,
  isSizeStated,
  limitToExpectedSize,
  toFileHeaders,
} from "../sourceFile.js"
import { createWebdavClient } from "./index.js"
import { downloadFromWebdav, getFileMetadataFromWebdav } from "./operations.js"

/**
 * Streams a file from the server `connector` names, with `password`, with
 * the download's headers that describe it. `size` is the length the server's
 * download states, when uncompressed. The stream fails past `expectedSize`,
 * that length or else the size the file's metadata states: the server is the
 * user's, and could state less than it sends.
 *
 * @throws the WebDAV client's errors as they come, so each caller answers
 * them by its own rules, and `FileSizeUnstatedError` when the server states
 * no size for the file.
 */
export const streamWebdavFile = async ({
  connector,
  password,
  filePath,
}: {
  connector: WebdavConnectorDocType
  password: string
  filePath: string
}) => {
  const client = createWebdavClient({ ...connector, password })
  const { bookMetadata } = await getFileMetadataFromWebdav(client, filePath)
  const statedSize = toByteCount(bookMetadata.size)

  if (!isSizeStated(statedSize)) throw new FileSizeUnstatedError()

  const { stream, size, headers } = await downloadFromWebdav(client, filePath)

  return {
    ...limitToExpectedSize({ stream, size, statedSize }),
    headers: toFileHeaders(function readDownloadHeader(name) {
      return headers.get(name) ?? undefined
    }),
  }
}
