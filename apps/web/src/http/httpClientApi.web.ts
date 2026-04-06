import type {
  AuthSessionResponse,
  CompleteMagicLinkRequest,
  CompleteMagicLinkResponse,
  CompleteSignUpRequest,
  CompleteSignUpResponse,
  DeleteAccountResponse,
  RefreshTokenResponse,
  RequestMagicLinkRequest,
  RequestMagicLinkResponse,
  RequestSignUpRequest,
  RequestSignUpResponse,
  SignInWithEmailRequest,
  SignInWithGoogleRequest,
} from "@oboku/shared"
import { authStateSignal } from "../auth/states.web"
import { configuration } from "../config/configuration"
import { type FetchConfig, HttpClientError } from "./httpClient.shared"
import { HttpClientWeb } from "./httpClient.web"
import { injectToken } from "./injectToken.web"
import type { AuthSession } from "../auth/types"

class HttpApiClient extends HttpClientWeb {
  authWithMagicLink = (data: CompleteMagicLinkRequest) =>
    this.post<CompleteMagicLinkResponse, CompleteMagicLinkRequest>(
      `${configuration.API_URL}/auth/magic-link/complete`,
      {
        body: data,
      },
    )

  refreshBookMetadata = (params: {
    bookId: string
    providerCredentials?: Record<string, unknown>
  }) =>
    this.post(`${configuration.API_URL}/books/metadata/refresh`, {
      body: params,
    })

  refreshCollectionMetadata = (params: {
    collectionId: string
    providerCredentials?: Record<string, unknown>
  }) =>
    this.post(`${configuration.API_URL}/collections/metadata/refresh`, {
      body: { ...params, soft: false },
    })

  syncDataSource = (params: {
    dataSourceId: string
    providerCredentials?: Record<string, unknown>
  }) =>
    this.post(`${configuration.API_URL}/datasources/sync`, {
      body: params,
    })

  signInWithEmail = (data: SignInWithEmailRequest) =>
    this.post<AuthSessionResponse, SignInWithEmailRequest>(
      `${configuration.API_URL}/auth/signin/email`,
      {
        body: data,
      },
    )

  signInWithGoogle = (data: SignInWithGoogleRequest) =>
    this.post<AuthSessionResponse, SignInWithGoogleRequest>(
      `${configuration.API_URL}/auth/signin/google`,
      {
        body: data,
      },
    )

  signUp = (data: RequestSignUpRequest) =>
    this.post<RequestSignUpResponse, RequestSignUpRequest>(
      `${configuration.API_URL}/auth/signup`,
      {
        body: data,
      },
    )

  completeSignUp = (data: CompleteSignUpRequest) =>
    this.post<CompleteSignUpResponse, CompleteSignUpRequest>(
      `${configuration.API_URL}/auth/signup/complete`,
      {
        body: data,
      },
    )

  requestMagicLink = (data: RequestMagicLinkRequest) =>
    this.post<RequestMagicLinkResponse, RequestMagicLinkRequest>(
      `${configuration.API_URL}/auth/magic-link`,
      {
        body: data,
      },
    )

  markNotificationAsSeen = ({ id }: { id: number }) =>
    this.post(`${configuration.API_URL}/notifications/${id}/seen`)

  markAllNotificationsAsSeen = () =>
    this.post(`${configuration.API_URL}/notifications/seen`)

  archiveNotification = ({ id }: { id: number }) =>
    this.post(`${configuration.API_URL}/notifications/${id}/archive`)

  refreshToken = ({
    refreshToken,
    useInterceptors = true,
  }: {
    refreshToken: string
    useInterceptors: boolean
  }) => {
    return this.post<RefreshTokenResponse, never>(
      `${configuration.API_URL}/auth/token?grant_type=refresh_token&refresh_token=${refreshToken}`,
      {
        useInterceptors,
      },
    )
  }

  deleteAccount = () =>
    this.fetch<DeleteAccountResponse>(`${configuration.API_URL}/auth/account`, {
      method: "DELETE",
    })
}

export const httpClientApi = new HttpApiClient()

let refreshSessionPromise: Promise<AuthSession | null> | null = null

const refreshAuthState = async (refreshToken: string) => {
  const response = await httpClientApi.refreshToken({
    refreshToken,
    useInterceptors: false,
  })

  authStateSignal.update((state) => {
    if (!state) return state

    return {
      ...state,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    }
  })

  return authStateSignal.value
}

export const refreshAuthSession = async (refreshToken: string) => {
  if (!refreshSessionPromise) {
    refreshSessionPromise = refreshAuthState(refreshToken).finally(() => {
      refreshSessionPromise = null
    })
  }

  return refreshSessionPromise
}

export const refreshTokenAndRetry = async (
  config: FetchConfig,
  refreshToken: string,
) => {
  try {
    await refreshAuthSession(refreshToken)
  } catch (e) {
    console.log("Unable to refresh token")
    console.error(e)

    throw e
  }

  return httpClientApi.fetch(config.input, config)
}

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpClientApi.useRequestInterceptor(injectToken)

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpClientApi.useResponseInterceptor(
  async (response) => response,
  async (error: HttpClientError) => {
    if (error instanceof HttpClientError && error.response?.status === 401) {
      const refreshToken = authStateSignal.value?.refreshToken

      if (refreshToken) {
        try {
          return refreshTokenAndRetry(error.response.config, refreshToken)
        } catch (_e) {
          throw error
        }
      }
    }

    throw error
  },
)
