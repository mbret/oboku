import { pipeline, type Readable } from "node:stream"
import { toByteCount } from "../http/contentLength.js"
import { type AnswerHeaders, toHeaderText } from "../http/userAddressRequest.js"
import type { FileHeaders } from "../quotas/proxied-download-quota.service.js"
import { createByteLimitTransform } from "./plugins.service.js"

export class FileSizeUnstatedError extends Error {
  constructor() {
    super("The server states no size for the file")
  }
}

export const isSizeStated = (size: number | undefined): size is number =>
  size !== undefined && size > 0

/**
 * `stream`, failing past its expected size: `size`, the length the download
 * states, or else `statedSize`. The source could state less than it sends.
 *
 * @throws `FileSizeUnstatedError`, with `stream` destroyed, when the expected
 * size is missing or 0.
 */
export const limitToExpectedSize = ({
  stream,
  size,
  statedSize,
}: {
  stream: Readable
  size: number | undefined
  statedSize?: number
}) => {
  const expectedSize = size ?? statedSize

  if (!isSizeStated(expectedSize)) {
    stream.destroy()

    throw new FileSizeUnstatedError()
  }

  return {
    stream: pipeline(
      stream,
      createByteLimitTransform(expectedSize),
      function leaveErrorsToTheMeteredStream() {},
    ),
    size,
    expectedSize,
  }
}

/**
 * The headers of a source's answer that describe its file, which the proxy
 * passes on as they are. `readHeader` reads one by its lowercase name.
 */
export const toFileHeaders = (
  readHeader: (
    name: "content-type" | "content-disposition",
  ) => string | undefined,
): FileHeaders => ({
  "Content-Type": readHeader("content-type"),
  "Content-Disposition": readHeader("content-disposition"),
})

/**
 * The file an answer holds, failing past the length it states or else
 * `statedSize`, with the answer's headers that describe it.
 *
 * @throws the errors of `limitToExpectedSize`.
 */
export const toAnswerFile = ({
  stream,
  headers,
  statedSize,
}: {
  stream: Readable
  headers: AnswerHeaders
  statedSize?: number
}) => ({
  ...limitToExpectedSize({
    stream,
    size: toByteCount(toHeaderText(headers["content-length"])),
    statedSize,
  }),
  headers: toFileHeaders(function readAnswerHeader(name) {
    return toHeaderText(headers[name])
  }),
})
