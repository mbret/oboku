import {
  getOpdsCredentialHeaders,
  isOpdsConnectorOrigin,
  ObokuErrorCode,
  ObokuSharedError,
  type SettingsResolvedConnectorData,
} from "@oboku/shared"
import {
  createAnsweredStatusError,
  isSuccessStatus,
  requestUserAddress,
} from "../../http/userAddressRequest.js"

export type OpdsConnector = SettingsResolvedConnectorData<"opds">

type CatalogRequestOptions = {
  headers?: Record<string, string>
  signal?: AbortSignal
}

const REDIRECT_STATUSES = [301, 302, 303, 307, 308]
const MAX_REDIRECTS = 5

/**
 * Redirects are followed here rather than by axios, so that only requests to
 * the connector's origin carry its credentials and accept its self-signed
 * certificate.
 *
 * @returns `url`, the address that answered after the redirects.
 * @throws the errors of `requestUserAddress`, and an error with the `status`
 * the catalog answered with when it answered neither a success nor a
 * redirect: an `ObokuSharedError` with `ERROR_DATASOURCE_UNAUTHORIZED` for a
 * 401.
 */
export async function getFromCatalog(
  connector: OpdsConnector,
  requestedUrl: URL,
  { headers = {}, signal }: CatalogRequestOptions = {},
) {
  let url = requestedUrl

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const request = `OPDS request to ${url.origin}`
    const isConnectorOrigin = isOpdsConnectorOrigin(url.href, connector.url)
    const answer = await requestUserAddress({
      url,
      request,
      headers: { ...headers, ...getOpdsCredentialHeaders(url.href, connector) },
      maxRedirects: 0,
      allowSelfSigned: connector.allowSelfSigned && isConnectorOrigin,
      signal,
    })

    if (isSuccessStatus(answer.status)) {
      return { stream: answer.stream, url, headers: answer.headers }
    }

    answer.stream.destroy()

    if (answer.status === 401) {
      throw Object.assign(
        new ObokuSharedError(ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED),
        { status: answer.status },
      )
    }

    const { location } = answer.headers
    const isRedirect =
      REDIRECT_STATUSES.includes(answer.status) && typeof location === "string"

    if (!isRedirect) throw createAnsweredStatusError(request, answer.status)

    if (!URL.canParse(location, url)) {
      throw new Error(`${request} was redirected to an invalid address`)
    }

    url = new URL(location, url)
  }

  throw new Error(
    `OPDS request to ${requestedUrl.origin} was redirected more than ${MAX_REDIRECTS} times`,
  )
}
