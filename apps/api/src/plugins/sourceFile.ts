import { pipeline, type Readable } from "node:stream"
import { getFileNameFromContentDisposition } from "@oboku/shared"
import { toByteCount } from "../http/contentLength.js"
import { type AnswerHeaders, toHeaderText } from "../http/userAddressRequest.js"
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
 * The file an answer holds, failing past the length it states or else
 * `statedSize`. Named as its `Content-Disposition` names it, else
 * `fallbackName`, and typed with its type, else `fallbackType`.
 *
 * @throws the errors of `limitToExpectedSize`.
 */
export const toAnswerFile = ({
  stream,
  headers,
  statedSize,
  fallbackName,
  fallbackType,
}: {
  stream: Readable
  headers: AnswerHeaders
  statedSize?: number
  fallbackName: string
  fallbackType?: string
}) => {
  return {
    ...limitToExpectedSize({
      stream,
      size: toByteCount(toHeaderText(headers["content-length"])),
      statedSize,
    }),
    name:
      getFileNameFromContentDisposition(
        toHeaderText(headers["content-disposition"]),
      ) ?? fallbackName,
    contentType: toHeaderText(headers["content-type"]) || fallbackType,
  }
}
