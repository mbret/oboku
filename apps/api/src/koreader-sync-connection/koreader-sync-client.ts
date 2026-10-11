import { request as requestHttp } from "node:http"
import { request as requestHttps } from "node:https"
import { isIP } from "node:net"
import {
  isPublicAddress,
  lookupPublicAddress,
  NonPublicAddressError,
} from "../lib/http/publicAddress.js"

const REQUEST_TIMEOUT_MS = 10_000
const MAX_RESPONSE_BYTES = 64 * 1024

/** The media type KOReader's sync client accepts (its `api.json`). */
const KOREADER_SYNC_ACCEPT = "application/vnd.koreader.v1+json"

export type KoreaderSyncServerResponse = {
  status: number
  body: unknown
}

/**
 * The server did not answer, answered too slowly or too much, or not with
 * JSON: whatever is at the address is not a working KOReader sync server.
 */
export class KoreaderSyncServerUnreachableError extends Error {
  constructor(cause?: unknown) {
    super("The KOReader sync server could not be reached", { cause })
    this.name = "KoreaderSyncServerUnreachableError"
  }
}

const toServerEndpoint = (serverUrl: string, path: string) =>
  new URL(`${serverUrl.replace(/\/+$/, "")}${path}`)

/** `URL.hostname` keeps the brackets around an IPv6 literal. */
const toHostAddress = (hostname: string) => hostname.replace(/^\[|\]$/g, "")

/**
 * Sends one KOReader sync request to a user's server, as KOReader would, from
 * the API. Unless `allowNonPublicAddress` is set, a server that is not on the
 * public internet is refused with a {@link NonPublicAddressError}.
 */
export function requestKoreaderSyncServer({
  serverUrl,
  path,
  method,
  username,
  key,
  body,
  allowNonPublicAddress,
}: {
  serverUrl: string
  path: string
  method: "GET" | "PUT"
  username: string
  key: string
  body?: unknown
  allowNonPublicAddress: boolean
}): Promise<KoreaderSyncServerResponse> {
  const endpoint = toServerEndpoint(serverUrl, path)
  const hostAddress = toHostAddress(endpoint.hostname)
  // Node does not call `lookup` for a host that is already an address.
  const isNonPublicAddressLiteral =
    isIP(hostAddress) !== 0 && !isPublicAddress(hostAddress)

  if (!allowNonPublicAddress && isNonPublicAddressLiteral) {
    return Promise.reject(new NonPublicAddressError(hostAddress))
  }

  const payload = body === undefined ? undefined : JSON.stringify(body)
  const request = endpoint.protocol === "https:" ? requestHttps : requestHttp

  return new Promise(function sendKoreaderSyncRequest(resolve, reject) {
    const outgoing = request(endpoint, {
      method,
      timeout: REQUEST_TIMEOUT_MS,
      lookup: allowNonPublicAddress ? undefined : lookupPublicAddress,
      headers: {
        accept: KOREADER_SYNC_ACCEPT,
        "x-auth-user": username,
        "x-auth-key": key,
        ...(payload !== undefined && {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload),
        }),
      },
    })

    outgoing.on("timeout", function abortSlowRequest() {
      outgoing.destroy(new KoreaderSyncServerUnreachableError("timeout"))
    })

    outgoing.on("error", function rejectFailedRequest(error) {
      reject(
        error instanceof NonPublicAddressError ||
          error instanceof KoreaderSyncServerUnreachableError
          ? error
          : new KoreaderSyncServerUnreachableError(error),
      )
    })

    outgoing.on("response", function readJsonResponse(response) {
      const chunks: Buffer[] = []
      let receivedBytes = 0

      response.on("data", function collectChunk(chunk: Buffer) {
        receivedBytes += chunk.length

        if (receivedBytes > MAX_RESPONSE_BYTES) {
          outgoing.destroy(
            new KoreaderSyncServerUnreachableError("response too large"),
          )

          return
        }

        chunks.push(chunk)
      })

      response.on("end", function parseJsonResponse() {
        try {
          resolve({
            status: response.statusCode ?? 0,
            body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
          })
        } catch (error) {
          reject(new KoreaderSyncServerUnreachableError(error))
        }
      })

      response.on("error", function rejectBrokenResponse(error) {
        reject(new KoreaderSyncServerUnreachableError(error))
      })
    })

    outgoing.end(payload)
  })
}
