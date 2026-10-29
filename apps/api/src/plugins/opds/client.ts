import type { Readable } from "node:stream"
import {
  getOpdsCredentialHeaders,
  getOpdsUrlOrigin,
  isOpdsConnectorOrigin,
  ObokuErrorCode,
  ObokuSharedError,
  type SettingsResolvedConnectorData,
} from "@oboku/shared"
import axios from "axios"
import { toRequestFailure } from "../../http/requestFailure.js"
import { getUserAddressRequestOptions } from "../../http/userAddressAgents.js"

export type OpdsConnector = SettingsResolvedConnectorData<"opds">

type CatalogRequestOptions = {
  headers?: Record<string, string>
  signal?: AbortSignal
}

const REDIRECT_STATUSES = [301, 302, 303, 307, 308]
const MAX_REDIRECTS = 5
const RESPONSE_TIMEOUT_MS = 60_000

const acceptEveryStatus = () => true

export const toCatalogRequestFailure = (url: URL, error: unknown) =>
  axios.isAxiosError(error)
    ? toRequestFailure(`OPDS request to ${url.origin} failed`, error)
    : error

const requestFromCatalog = (
  connector: OpdsConnector,
  url: URL,
  { headers = {}, signal }: CatalogRequestOptions,
) => {
  const isConnectorOrigin = isOpdsConnectorOrigin(url.href, connector.url)

  return axios
    .get<Readable>(url.href, {
      headers: { ...headers, ...getOpdsCredentialHeaders(url.href, connector) },
      maxRedirects: 0,
      responseType: "stream",
      signal,
      timeout: RESPONSE_TIMEOUT_MS,
      validateStatus: acceptEveryStatus,
      ...getUserAddressRequestOptions({
        allowSelfSigned: connector.allowSelfSigned && isConnectorOrigin,
      }),
    })
    .catch(function throwCatalogRequestFailure(error: unknown) {
      throw toCatalogRequestFailure(url, error)
    })
}

/**
 * Redirects are followed here rather than by axios, so that only requests to
 * the connector's origin carry its credentials and accept its self-signed
 * certificate.
 */
export async function getFromCatalog(
  connector: OpdsConnector,
  requestedUrl: URL,
  options: CatalogRequestOptions = {},
): Promise<{ stream: Readable; url: URL }> {
  let url = requestedUrl

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    if (getOpdsUrlOrigin(url.href) === undefined) {
      throw new Error(`OPDS URLs must be http(s), not ${url.protocol}`)
    }

    const response = await requestFromCatalog(connector, url, options)
    const isSuccess = response.status >= 200 && response.status < 300

    if (isSuccess) return { stream: response.data, url }

    response.data.destroy()

    if (response.status === 401) {
      throw new ObokuSharedError(ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED)
    }

    const { location } = response.headers
    const isRedirect =
      REDIRECT_STATUSES.includes(response.status) &&
      typeof location === "string"

    if (!isRedirect) {
      throw new Error(
        `OPDS request to ${url.origin} failed with status ${response.status}`,
      )
    }

    if (!URL.canParse(location, url)) {
      throw new Error(
        `OPDS request to ${url.origin} was redirected to an invalid address`,
      )
    }

    url = new URL(location, url)
  }

  throw new Error(
    `OPDS request to ${requestedUrl.origin} was redirected more than ${MAX_REDIRECTS} times`,
  )
}
