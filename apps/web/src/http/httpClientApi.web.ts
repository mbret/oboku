import type {
  AuthSessionResponse,
  CompleteMagicLinkRequest,
  CompleteMagicLinkResponse,
  CompleteSignUpRequest,
  CompleteSignUpResponse,
  DeleteAccountResponse,
  RefreshBookMetadataRequest,
  RefreshBookMetadataResponse,
  RefreshCollectionMetadataRequest,
  RefreshCollectionMetadataResponse,
  RefreshTokenResponse,
  RequestMagicLinkRequest,
  RequestMagicLinkResponse,
  RequestSignUpRequest,
  RequestSignUpResponse,
  SignInWithEmailRequest,
  SignInWithGoogleRequest,
  SyncDataSourceRequest,
  SyncDataSourceResponse,
} from "@oboku/shared"
import { authStateSignal } from "../auth/states.web"
import { API_URL } from "../config/envs"
import { HttpClientError, type HttpClientResponse } from "./httpClient.shared"
import { HttpClientWeb } from "./httpClient.web"
import { injectToken } from "./injectToken.web"

class HttpApiClient extends HttpClientWeb {
  authWithMagicLink = (data: CompleteMagicLinkRequest) =>
    this.postOrThrow<CompleteMagicLinkResponse, CompleteMagicLinkRequest>(
      `${API_URL}/auth/magic-link/complete`,
      {
        body: data,
      },
    )

  refreshBookMetadata = (params: RefreshBookMetadataRequest) =>
    this.postOrThrow<RefreshBookMetadataResponse, RefreshBookMetadataRequest>(
      `${API_URL}/books/metadata/refresh`,
      {
        body: params,
      },
    )

  refreshCollectionMetadata = (params: RefreshCollectionMetadataRequest) =>
    this.postOrThrow<
      RefreshCollectionMetadataResponse,
      RefreshCollectionMetadataRequest
    >(`${API_URL}/collections/metadata/refresh`, {
      body: { ...params, soft: params.soft ?? false },
    })

  syncDataSource = (params: SyncDataSourceRequest) =>
    this.postOrThrow<SyncDataSourceResponse, SyncDataSourceRequest>(
      `${API_URL}/datasources/sync`,
      {
        body: params,
      },
    )

  signInWithEmail = (data: SignInWithEmailRequest) =>
    this.postOrThrow<AuthSessionResponse, SignInWithEmailRequest>(
      `${API_URL}/auth/signin/email`,
      {
        body: data,
      },
    )

  signInWithGoogle = (data: SignInWithGoogleRequest) =>
    this.postOrThrow<AuthSessionResponse, SignInWithGoogleRequest>(
      `${API_URL}/auth/signin/google`,
      {
        body: data,
      },
    )

  signUp = (data: RequestSignUpRequest) =>
    this.postOrThrow<RequestSignUpResponse, RequestSignUpRequest>(
      `${API_URL}/auth/signup`,
      {
        body: data,
      },
    )

  completeSignUp = (data: CompleteSignUpRequest) =>
    this.postOrThrow<CompleteSignUpResponse, CompleteSignUpRequest>(
      `${API_URL}/auth/signup/complete`,
      {
        body: data,
      },
    )

  requestMagicLink = (data: RequestMagicLinkRequest) =>
    this.postOrThrow<RequestMagicLinkResponse, RequestMagicLinkRequest>(
      `${API_URL}/auth/magic-link`,
      {
        body: data,
      },
    )

  markNotificationAsSeen = ({ id }: { id: number }) =>
    this.postOrThrow(`${API_URL}/notifications/${id}/seen`)

  markAllNotificationsAsSeen = () =>
    this.postOrThrow(`${API_URL}/notifications/seen`)

  archiveNotification = ({ id }: { id: number }) =>
    this.postOrThrow(`${API_URL}/notifications/${id}/archive`)

  refreshToken = ({
    refreshToken,
    useInterceptors = true,
  }: {
    refreshToken: string
    useInterceptors: boolean
  }) => {
    return this.postOrThrow<RefreshTokenResponse, never>(
      `${API_URL}/auth/token?grant_type=refresh_token&refresh_token=${refreshToken}`,
      {
        useInterceptors,
      },
    )
  }

  deleteAccount = () =>
    this.fetchOrThrow<DeleteAccountResponse>(`${API_URL}/auth/account`, {
      method: "DELETE",
    })
}

export const httpClientApi = new HttpApiClient()

type InFlightRefresh = {
  refreshToken: string
  promise: Promise<boolean>
}

let refreshSessionPromise: InFlightRefresh | null = null

const refreshAuthState = async (refreshToken: string) => {
  const response = await httpClientApi.refreshToken({
    refreshToken,
    useInterceptors: false,
  })

  const authState = authStateSignal.getValue()

  // we are checking if the current auth state is the same as the refresh token
  // if not, we are not going to refresh the auth state as it's not the same session
  if (!authState || authState.refreshToken !== refreshToken) {
    return false
  }

  const nextAuthState = {
    ...authState,
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
    needsRelogin: false,
  }

  authStateSignal.update(nextAuthState)

  const didApply = !!nextAuthState

  return didApply
}

export const refreshAuthSession = (refreshToken: string) => {
  if (refreshSessionPromise?.refreshToken === refreshToken) {
    return refreshSessionPromise.promise
  }

  const promise = refreshAuthState(refreshToken).finally(() => {
    if (refreshSessionPromise?.promise === promise) {
      refreshSessionPromise = null
    }
  })

  refreshSessionPromise = {
    refreshToken,
    promise,
  }

  return promise
}

const refreshTokenWasRejected = (error: unknown) =>
  error instanceof HttpClientError &&
  (error.response?.status === 401 || error.response?.status === 403)

const flagSessionForRelogin = (rejectedRefreshToken: string) => {
  const authState = authStateSignal.value

  if (
    authState?.refreshToken === rejectedRefreshToken &&
    !authState.needsRelogin
  ) {
    authStateSignal.update({ ...authState, needsRelogin: true })
  }
}

export const refreshOnUnauthorized = async (response: HttpClientResponse) => {
  if (response.status !== 401) {
    return response
  }

  const refreshToken = authStateSignal.value?.refreshToken

  if (!refreshToken) {
    return response
  }

  try {
    const didApply = await refreshAuthSession(refreshToken)

    if (!didApply) {
      return response
    }
  } catch (error) {
    console.log("Unable to refresh token")
    console.error(error)

    const sessionIsTrulyExpired = refreshTokenWasRejected(error)

    if (!sessionIsTrulyExpired) {
      return response
    }

    flagSessionForRelogin(refreshToken)

    return response
  }

  // Retry once with the refreshed token, but skip interceptors on the retry so
  // a persistent 401 can fall through to the later sign-out interceptor.
  const retriedConfig = await injectToken({
    ...response.config,
    useInterceptors: false,
  })

  return httpClientApi.fetch(retriedConfig.input, retriedConfig)
}

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpClientApi.useRequestInterceptor(injectToken)

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpClientApi.useResponseInterceptor(refreshOnUnauthorized)
