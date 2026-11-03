import axios from "axios"
import { getUserAddressRequestOptions } from "../../http/userAddressAgents.js"
import {
  KOREADER_SYNC_KEY_HEADER,
  KOREADER_SYNC_MEDIA_TYPE,
  KOREADER_SYNC_USERNAME_HEADER,
} from "../protocol.js"

const REQUEST_DEADLINE_MS = 10_000
const MAX_RESPONSE_BYTES = 64 * 1024

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

const toServerEndpoint = (serverUrl: string, route: string) =>
  `${serverUrl.replace(/\/+$/, "")}/${route}`

const acceptEveryStatus = () => true

/**
 * Sends one KOReader sync request to a user's server, as KOReader would, from
 * the API.
 */
export async function requestKoreaderSyncServer({
  serverUrl,
  route,
  method,
  username,
  key,
  body,
}: {
  serverUrl: string
  route: string
  method: "GET" | "PUT"
  username: string
  key: string
  body?: unknown
}): Promise<KoreaderSyncServerResponse> {
  try {
    const response = await axios.request<unknown>({
      url: toServerEndpoint(serverUrl, route),
      method,
      data: body,
      headers: {
        Accept: KOREADER_SYNC_MEDIA_TYPE,
        [KOREADER_SYNC_USERNAME_HEADER]: username,
        [KOREADER_SYNC_KEY_HEADER]: key,
      },
      responseType: "json",
      transitional: { silentJSONParsing: false },
      signal: AbortSignal.timeout(REQUEST_DEADLINE_MS),
      maxContentLength: MAX_RESPONSE_BYTES,
      ...getUserAddressRequestOptions(),
      validateStatus: acceptEveryStatus,
    })

    return { status: response.status, body: response.data }
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error

    const isPastDeadline = axios.isCancel(error)
    const reason = isPastDeadline
      ? `no answer within ${REQUEST_DEADLINE_MS} ms`
      : error.message

    // Not the AxiosError itself: its config holds the key.
    throw new KoreaderSyncServerUnreachableError(reason, { cause: error.cause })
  }
}
