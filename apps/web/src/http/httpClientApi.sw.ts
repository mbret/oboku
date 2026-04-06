import {
  type FetchConfig,
  HttpClient,
  HttpClientError,
} from "./httpClient.shared"
import { serviceWorkerCommunication } from "../workers/communication/communication.sw"

export const httpClientApi = new HttpClient()

const getAuthorizedHeaders = (
  headers: HeadersInit | undefined,
  accessToken: string,
) => {
  const nextHeaders = new Headers(headers)

  nextHeaders.set("Authorization", `Bearer ${accessToken}`)

  return nextHeaders
}

const retryUnauthorized = async (config: FetchConfig) => {
  if (!config.clientId) {
    return null
  }

  let authReply: Awaited<
    ReturnType<typeof serviceWorkerCommunication.refreshClientAuth>
  >

  try {
    authReply = await serviceWorkerCommunication.refreshClientAuth(
      config.clientId,
    )
  } catch (error) {
    console.error(error)

    return null
  }

  if (!authReply.payload?.accessToken) {
    return null
  }

  return httpClientApi.fetch(config.input, {
    ...config,
    headers: getAuthorizedHeaders(
      config.headers,
      authReply.payload.accessToken,
    ),
    useInterceptors: false,
  })
}

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpClientApi.useRequestInterceptor(async function injectAccessToken(config) {
  if (!config.clientId) {
    return config
  }

  let authReply: Awaited<
    ReturnType<typeof serviceWorkerCommunication.askClientAuth>
  >

  try {
    authReply = await serviceWorkerCommunication.askClientAuth(config.clientId)
  } catch (error) {
    console.error(error)

    return config
  }

  if (authReply.payload?.accessToken) {
    return {
      ...config,
      headers: getAuthorizedHeaders(
        config.headers,
        authReply.payload.accessToken,
      ),
    }
  }

  return config
})

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpClientApi.useResponseInterceptor(
  async (response) => {
    if (response.status === 401) {
      const retriedResponse = await retryUnauthorized(response.config).catch(
        () => null,
      )

      return retriedResponse ?? response
    }

    return response
  },
  async (error: HttpClientError) => {
    if (error instanceof HttpClientError && error.response?.status === 401) {
      const retriedResponse = await retryUnauthorized(
        error.response.config,
      ).catch(() => null)

      if (retriedResponse) {
        return retriedResponse
      }
    }

    throw error
  },
)
