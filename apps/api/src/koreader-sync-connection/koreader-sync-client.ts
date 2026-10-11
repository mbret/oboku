import axios from "axios"
import { getUserAddressRequestOptions } from "../lib/http/userAddressAgents.js"

const REQUEST_TIMEOUT_MS = 10_000
const MAX_RESPONSE_BYTES = 64 * 1024

/** The media type KOReader's sync client accepts (its `api.json`). */
const KOREADER_SYNC_ACCEPT = "application/vnd.koreader.v1+json"

export type KoreaderSyncServerResponse = {
  status: number
  body: unknown
}

/**
 * No answer came back from the server, its address was refused, or it answered
 * too slowly, too much, or not with JSON: whatever is at the address is not a
 * working KOReader sync server.
 */
export class KoreaderSyncServerUnreachableError extends Error {
  constructor(reason: string, options?: ErrorOptions) {
    super(`The KOReader sync server could not be reached: ${reason}`, options)
    this.name = "KoreaderSyncServerUnreachableError"
  }
}

const toServerEndpoint = (serverUrl: string, path: string) =>
  `${serverUrl.replace(/\/+$/, "")}${path}`

const acceptEveryStatus = () => true

/**
 * Sends one KOReader sync request to a user's server, as KOReader would, from
 * the API.
 */
export async function requestKoreaderSyncServer({
  serverUrl,
  path,
  method,
  username,
  key,
  body,
}: {
  serverUrl: string
  path: string
  method: "GET" | "PUT"
  username: string
  key: string
  body?: unknown
}): Promise<KoreaderSyncServerResponse> {
  try {
    const response = await axios.request<unknown>({
      url: toServerEndpoint(serverUrl, path),
      method,
      data: body,
      headers: {
        Accept: KOREADER_SYNC_ACCEPT,
        "x-auth-user": username,
        "x-auth-key": key,
      },
      responseType: "json",
      transitional: { silentJSONParsing: false },
      timeout: REQUEST_TIMEOUT_MS,
      maxContentLength: MAX_RESPONSE_BYTES,
      ...getUserAddressRequestOptions(),
      validateStatus: acceptEveryStatus,
    })

    return { status: response.status, body: response.data }
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error

    // Not the AxiosError itself: its config holds the key.
    throw new KoreaderSyncServerUnreachableError(error.message, {
      cause: error.cause,
    })
  }
}
