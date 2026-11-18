import { pipeline } from "node:stream"
import type { WebdavConnectorDocType } from "@oboku/shared"
import { toByteCount } from "../../http/contentLength.js"
import { createByteLimitTransform } from "../plugins.service.js"
import { createWebdavClient } from "./index.js"
import { downloadFromWebdav, getFileMetadataFromWebdav } from "./operations.js"

export class FileSizeUnstatedError extends Error {
  constructor() {
    super("The WebDAV server states no size for the file")
  }
}

/**
 * Streams a file from the server `connector` names, with `password`. `size`
 * is the length the server's download states, when uncompressed. The stream
 * fails past `expectedSize`, that length or else the size the file's
 * metadata states: the server is the user's, and could state less than it
 * sends.
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
  const { name, contentType, bookMetadata } = await getFileMetadataFromWebdav(
    client,
    filePath,
  )
  const statedSize = toByteCount(bookMetadata.size)
  const isSizeStated = statedSize !== undefined && statedSize > 0

  if (!isSizeStated) throw new FileSizeUnstatedError()

  const { stream, size } = await downloadFromWebdav(client, filePath)
  const expectedSize = size ?? statedSize

  return {
    stream: pipeline(
      stream,
      createByteLimitTransform(expectedSize),
      function leaveErrorsToTheMeteredStream() {},
    ),
    name,
    contentType,
    size,
    expectedSize,
  }
}
