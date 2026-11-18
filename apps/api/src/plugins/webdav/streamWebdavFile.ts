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
 * Streams a file from the server `connector` names, with `password`. The
 * stream fails past the size the server states: the server is the user's,
 * and could state less than it sends.
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

  const { stream } = await downloadFromWebdav(client, filePath)

  return {
    stream: pipeline(
      stream,
      createByteLimitTransform(statedSize),
      function leaveErrorsToTheMeteredStream() {},
    ),
    name,
    contentType,
    statedSize,
  }
}
