import {
  adminRefreshToken,
  type ApiClient,
  createApiClient,
} from "@oboku/shared"
import { config } from "@/config"
import { readResponseErrorMessage } from "./readResponseErrorMessage"
import { authState, clearTokens, persistTokens } from "./states"

let refreshPromise: Promise<void> | null = null

const refreshAccessToken = async () => {
  const { refresh_token } = authState.value

  if (!refresh_token) {
    throw new Error("No refresh token")
  }

  const { data } = await adminRefreshToken({
    client: apiClient,
    fetch,
    body: { refresh_token },
  })

  persistTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  })
  authState.update({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  })
}

const withAccessToken = (request: Request) => {
  request.headers.set("Authorization", `Bearer ${authState.value.access_token}`)

  return request
}

const authenticatedFetch = async (request: Request) => {
  const replay = request.clone()
  const response = await fetch(withAccessToken(request))

  if (response.status !== 401) {
    return response
  }

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(
      function clearSettledRefresh() {
        refreshPromise = null
      },
    )
  }

  try {
    await refreshPromise
  } catch {
    clearTokens()
    throw new Error("Session expired")
  }

  return fetch(withAccessToken(replay))
}

const sendGeneratedRequest = async (
  input: RequestInfo | URL,
  init?: RequestInit,
) => {
  const response = await authenticatedFetch(new Request(input, init))

  if (!response.ok) {
    throw new Error(
      await readResponseErrorMessage(
        response,
        response.statusText || `Request failed with status ${response.status}`,
      ),
    )
  }

  return response
}

/**
 * The `client` to pass to the generated API functions. Sign-in and the token
 * refresh pass the browser's `fetch` along with it, so they send no access
 * token.
 */
export const apiClient: ApiClient = createApiClient({
  baseUrl: config.apiUrl,
  throwOnError: true,
  fetch: sendGeneratedRequest,
})
