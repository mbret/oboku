import { PassThrough, type Readable } from "node:stream"
import { isHttpUrl } from "@oboku/shared"
import axios, { type AxiosResponse } from "axios"
import { toRequestFailure } from "./requestFailure.js"
import { getUserAddressRequestOptions } from "./userAddressAgents.js"

const RESPONSE_TIMEOUT_MS = 60_000

const acceptEveryStatus = () => true

/**
 * Asks a server for the file as it is: axios decompresses a compressed answer
 * but keeps its `Content-Length`, which counts the compressed bytes.
 */
export const UNCOMPRESSED_ANSWER_HEADERS = { "Accept-Encoding": "identity" }

export type AnswerHeaders = AxiosResponse["headers"]

export const toHeaderText = (value: unknown) =>
  typeof value === "string" ? value : undefined

export const isSuccessStatus = (status: number) => status >= 200 && status < 300

const toUserAddressRequestFailure = <Failure>(
  failure: string,
  error: Failure,
) => (axios.isAxiosError(error) ? toRequestFailure(failure, error) : error)

/**
 * axios reports an abort that comes after the headers on the answer stream,
 * with an error that holds the request's headers.
 */
function withRequestFailures(failure: string, answer: Readable) {
  const stream = new PassThrough()

  answer.on("error", function failWithRequestFailure(error) {
    stream.destroy(toUserAddressRequestFailure(failure, error))
  })
  stream.on("close", function stopReadingAnswer() {
    answer.destroy()
  })

  return answer.pipe(stream)
}

/** An error that holds the status a server answered with, as `toAnsweredStatus` reads it. */
export const createAnsweredStatusError = (request: string, status: number) =>
  Object.assign(new Error(`${request} failed with status ${status}`), {
    status,
  })

/**
 * GETs `url` from a server a user entered, through the private-network guard,
 * and answers every status. `request` names the request in its errors, such
 * as `OPDS request to https://catalog.example.com`.
 *
 * @throws for an address that is not http(s), and the request's failures
 * without its headers, from the promise and from the answer's stream.
 */
export async function requestUserAddress({
  url,
  request,
  headers,
  maxRedirects,
  allowSelfSigned,
  signal,
}: {
  url: URL
  request: string
  headers?: Record<string, string>
  maxRedirects?: number
  allowSelfSigned?: boolean
  signal?: AbortSignal
}) {
  const failure = `${request} failed`

  if (!isHttpUrl(url.href)) {
    throw new Error(`${failure}: ${url.protocol} is not http(s)`)
  }

  const response = await axios
    .get<Readable>(url.href, {
      headers,
      maxRedirects,
      responseType: "stream",
      signal,
      timeout: RESPONSE_TIMEOUT_MS,
      validateStatus: acceptEveryStatus,
      ...getUserAddressRequestOptions({ allowSelfSigned }),
    })
    .catch(function throwUserAddressRequestFailure(error: unknown) {
      throw toUserAddressRequestFailure(failure, error)
    })

  return {
    status: response.status,
    headers: response.headers,
    stream: withRequestFailures(failure, response.data),
  }
}
