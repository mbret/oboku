import { pipeline } from "node:stream"
import type { OpdsBookLinkData } from "@oboku/shared"
import { toByteCount } from "../../http/contentLength.js"
import {
  createByteLimitTransform,
  FileSizeUnstatedError,
} from "../plugins.service.js"
import { getFromCatalog, type OpdsConnector } from "./client.js"

/**
 * axios decompresses a compressed answer but keeps its `Content-Length`,
 * which counts the compressed bytes.
 */
const UNCOMPRESSED_ANSWER_HEADERS = { "Accept-Encoding": "identity" }

const toHeaderText = (value: unknown) =>
  typeof value === "string" ? value : undefined

/**
 * Streams a book's file from its catalog, with the credentials `connector`
 * holds. `size` is the length the catalog's answer states. The stream fails
 * past `expectedSize`, that length or else the one the feed states for the
 * file: the catalog is the user's, and could state less than it sends.
 *
 * @throws the errors of `getFromCatalog`, and `FileSizeUnstatedError`, with
 * the answer closed, when the answer states a length of 0, or neither the
 * answer nor the feed states one.
 */
export const streamOpdsFile = async ({
  connector,
  acquisition,
  title,
}: {
  connector: OpdsConnector
  acquisition: OpdsBookLinkData["acquisition"]
  title: string
}) => {
  const { stream, headers } = await getFromCatalog(
    connector,
    new URL(acquisition.href),
    { headers: UNCOMPRESSED_ANSWER_HEADERS },
  )
  const size = toByteCount(toHeaderText(headers["content-length"]))
  const expectedSize = size ?? acquisition.length
  const isSizeStated = expectedSize !== undefined && expectedSize > 0

  if (!isSizeStated) {
    stream.destroy()

    throw new FileSizeUnstatedError()
  }

  return {
    stream: pipeline(
      stream,
      createByteLimitTransform(expectedSize),
      function leaveErrorsToTheMeteredStream() {},
    ),
    name: title,
    size,
    expectedSize,
  }
}
