import { isRecord } from "./isRecord.js"

type FetchHeaders = Pick<Headers, "get" | "has">

const isFetchHeaders = (headers: unknown): headers is FetchHeaders =>
  isRecord(headers) &&
  typeof headers.get === "function" &&
  typeof headers.has === "function"

/**
 * The number of bytes a fetched body yields, from its `Content-Length`. None
 * for a compressed answer: fetch decompresses the body, and the header counts
 * the compressed bytes.
 *
 * Takes `unknown` because googleapis types its answers' headers as Node's,
 * while gaxios 8 hands it fetch's `Headers`.
 */
export const toDecodedContentLength = (headers: unknown) => {
  if (!isFetchHeaders(headers)) return undefined

  const contentLength = headers.get("content-length")
  const isCompressed = headers.has("content-encoding")
  const length = contentLength === null ? Number.NaN : Number(contentLength)

  return !isCompressed && Number.isSafeInteger(length) && length >= 0
    ? length
    : undefined
}
