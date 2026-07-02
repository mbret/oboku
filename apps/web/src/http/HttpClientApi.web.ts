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
import type { AuthSession } from "../auth/types"
import { API_URL } from "../config/envs"
import {
  type FetchConfig,
  HttpClientError,
  type HttpClientResponse,
} from "./httpClient.shared"
import { HttpClientWeb } from "./httpClient.web"

export type AuthSessionAccessor = {
  getSession: () => AuthSession | null | undefined
  setSession: (session: AuthSession) => void
}

type InFlightRefresh = {
  refreshToken: string
  promise: Promise<boolean>
}

const refreshTokenWasRejected = (error: unknown) =>
  error instanceof HttpClientError &&
  (error.response?.status === 401 || error.response?.status === 403)

export class HttpApiClientWeb extends HttpClientWeb {
  private refreshSessionPromise: InFlightRefresh | null = null

  constructor(private readonly authSession: AuthSessionAccessor) {
    super()

    // biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
    this.useRequestInterceptor(this.injectToken)
    // biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
    this.useResponseInterceptor(this.refreshOnUnauthorized)
  }

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

  private injectToken = async (config: FetchConfig): Promise<FetchConfig> => {
    const session = this.authSession.getSession()

    if (session?.accessToken) {
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    }

    return config
  }

  private flagSessionForRelogin = (rejectedRefreshToken: string) => {
    const authState = this.authSession.getSession()

    if (
      authState?.refreshToken === rejectedRefreshToken &&
      !authState.needsRelogin
    ) {
      this.authSession.setSession({ ...authState, needsRelogin: true })
    }
  }

  private refreshAuthState = async (refreshToken: string) => {
    const response = await this.refreshToken({
      refreshToken,
      useInterceptors: false,
    })

    const authState = this.authSession.getSession()

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

    this.authSession.setSession(nextAuthState)

    return true
  }

  refreshAuthSession = (refreshToken: string) => {
    if (this.refreshSessionPromise?.refreshToken === refreshToken) {
      return this.refreshSessionPromise.promise
    }

    const promise = this.refreshAuthState(refreshToken).finally(() => {
      if (this.refreshSessionPromise?.promise === promise) {
        this.refreshSessionPromise = null
      }
    })

    this.refreshSessionPromise = {
      refreshToken,
      promise,
    }

    return promise
  }

  refreshOnUnauthorized = async (response: HttpClientResponse) => {
    if (response.status !== 401) {
      return response
    }

    const refreshToken = this.authSession.getSession()?.refreshToken

    if (!refreshToken) {
      return response
    }

    try {
      const didApply = await this.refreshAuthSession(refreshToken)

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

      this.flagSessionForRelogin(refreshToken)

      return response
    }

    // Retry once with the refreshed token; skip interceptors so a persistent
    // 401 propagates to the caller instead of re-triggering another refresh.
    const retriedConfig = await this.injectToken({
      ...response.config,
      useInterceptors: false,
    })

    return this.fetch(retriedConfig.input, retriedConfig)
  }
}
