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
import type { HttpClientResponse } from "./httpClient.shared"
import { HttpClientWeb } from "./httpClient.web"
import { injectToken } from "./injectToken.web"
import type { AuthSession } from "../auth/types"

class HttpApiClient extends HttpClientWeb {
  authWithMagicLink = (data: CompleteMagicLinkRequest) =>
    this.postOrThrow<CompleteMagicLinkResponse, CompleteMagicLinkRequest>(
      `${configuration.API_URL}/auth/magic-link/complete`,
      {
        body: data,
      },
    )

  refreshBookMetadata = (params: {
    bookId: string
    providerCredentials?: Record<string, unknown>
  }) =>
    this.postOrThrow(`${configuration.API_URL}/books/metadata/refresh`, {
      body: params,
    })

  refreshCollectionMetadata = (params: {
    collectionId: string
    providerCredentials?: Record<string, unknown>
  }) =>
    this.postOrThrow(`${configuration.API_URL}/collections/metadata/refresh`, {
      body: { ...params, soft: false },
    })

  syncDataSource = (params: {
    dataSourceId: string
    providerCredentials?: Record<string, unknown>
  }) =>
    this.postOrThrow(`${configuration.API_URL}/datasources/sync`, {
      body: params,
    })

  signInWithEmail = (data: SignInWithEmailRequest) =>
    this.postOrThrow<AuthSessionResponse, SignInWithEmailRequest>(
      `${configuration.API_URL}/auth/signin/email`,
      {
        body: data,
      },
    )

  signInWithGoogle = (data: SignInWithGoogleRequest) =>
    this.postOrThrow<AuthSessionResponse, SignInWithGoogleRequest>(
      `${configuration.API_URL}/auth/signin/google`,
      {
        body: data,
      },
    )

  signUp = (data: RequestSignUpRequest) =>
    this.postOrThrow<RequestSignUpResponse, RequestSignUpRequest>(
      `${configuration.API_URL}/auth/signup`,
      {
        body: data,
      },
    )

  completeSignUp = (data: CompleteSignUpRequest) =>
    this.postOrThrow<CompleteSignUpResponse, CompleteSignUpRequest>(
      `${configuration.API_URL}/auth/signup/complete`,
      {
        body: data,
      },
    )

  requestMagicLink = (data: RequestMagicLinkRequest) =>
    this.postOrThrow<RequestMagicLinkResponse, RequestMagicLinkRequest>(
      `${configuration.API_URL}/auth/magic-link`,
      {
        body: data,
      },
    )

  markNotificationAsSeen = ({ id }: { id: number }) =>
    this.postOrThrow(`${configuration.API_URL}/notifications/${id}/seen`)

  markAllNotificationsAsSeen = () =>
    this.postOrThrow(`${configuration.API_URL}/notifications/seen`)

  archiveNotification = ({ id }: { id: number }) =>
    this.postOrThrow(`${configuration.API_URL}/notifications/${id}/archive`)

  refreshToken = ({
    refreshToken,
    useInterceptors = true,
  }: {
    refreshToken: string
    useInterceptors: boolean
  }) => {
    return this.postOrThrow<RefreshTokenResponse, never>(
      `${configuration.API_URL}/auth/token?grant_type=refresh_token&refresh_token=${refreshToken}`,
      {
        useInterceptors,
      },
    )
  }

  deleteAccount = () =>
    this.fetchOrThrow<DeleteAccountResponse>(
      `${configuration.API_URL}/auth/account`,
      {
        method: "DELETE",
      },
    )
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
  } catch (e) {
    console.log("Unable to refresh token")
    console.error(e)

    return response
  }

  return httpClientApi.fetch(response.config.input, response.config)
}

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpClientApi.useRequestInterceptor(injectToken)

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpClientApi.useResponseInterceptor(refreshOnUnauthorized)
