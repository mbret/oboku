import type {
  AuthSessionResponse,
  CompleteMagicLinkRequest,
  CompleteMagicLinkResponse,
  CompleteSignUpRequest,
  CompleteSignUpResponse,
  DeleteAccountResponse,
  LogoutRequest,
  LogoutResponse,
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
import type { Profile } from "../profiles/types"
import { API_URL } from "../config/envs"
import { signRefreshProof } from "../auth/proofKey"
import {
  type FetchConfig,
  HttpClientError,
  type HttpClientResponse,
} from "./httpClient.shared"
import { HttpClientWeb } from "./httpClient.web"

export type SessionStore = {
  get: () => Promise<Profile | null>
  set: (session: Profile) => Promise<void>
}

const refreshTokenWasRejected = (error: unknown) =>
  error instanceof HttpClientError &&
  (error.response?.status === 401 || error.response?.status === 403)

export class HttpApiClientWeb extends HttpClientWeb {
  private refreshSessionPromise: Promise<boolean> | null = null
  /** Bumped after every applied refresh; see `FetchConfig.authEpoch`. */
  private refreshEpoch = 0
  private sessionStore: SessionStore = {
    get: async () => null,
    set: async () => {},
  }

  constructor() {
    super({ credentials: "include" })

    // biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
    this.useRequestInterceptor(this.stampAuthEpoch)
    // biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
    this.useResponseInterceptor(this.refreshOnUnauthorized)
  }

  configureSessionStore = (store: SessionStore) => {
    this.sessionStore = store
  }

  private getSession = () => this.sessionStore.get()

  private commitSession = (session: Profile) => this.sessionStore.set(session)

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

  /**
   * The refresh credential is the httpOnly cookie; the DPoP proof header
   * proves possession of the session's bound key.
   */
  refreshToken = async ({
    useInterceptors = true,
  }: {
    useInterceptors?: boolean
  } = {}) => {
    const url = `${API_URL}/auth/token?grant_type=refresh_token`
    const proof = await signRefreshProof(url).catch(() => undefined)

    return this.postOrThrow<RefreshTokenResponse, never>(url, {
      headers: proof ? { DPoP: proof } : {},
      useInterceptors,
    })
  }

  /**
   * Revokes the server-side refresh session and clears the auth cookies. The
   * refresh cookie is the credential (`refresh_token` in the body only for
   * legacy pre-cookie tombstones), so interceptors are skipped: no refresh-
   * on-401 dance for a session being killed.
   */
  logout = (data: LogoutRequest = {}) =>
    this.postOrThrow<LogoutResponse, LogoutRequest>(`${API_URL}/auth/logout`, {
      body: data,
      useInterceptors: false,
    })

  deleteAccount = () =>
    this.fetchOrThrow<DeleteAccountResponse>(`${API_URL}/auth/account`, {
      method: "DELETE",
    })

  private stampAuthEpoch = async (
    config: FetchConfig,
  ): Promise<FetchConfig> => ({
    ...config,
    authEpoch: this.refreshEpoch,
  })

  private flagSessionForRelogin = async (sessionId: string) => {
    const authState = await this.getSession()

    if (authState?.id === sessionId && !authState.needsRelogin) {
      await this.commitSession({ ...authState, needsRelogin: true })
    }
  }

  private refreshAuthState = async () => {
    const sessionBeforeRefresh = await this.getSession()

    if (!sessionBeforeRefresh) {
      return false
    }

    await this.refreshToken({ useInterceptors: false })

    this.refreshEpoch++

    const authState = await this.getSession()

    // the session changed hands while refreshing; the fresh cookies belong to
    // whoever is active now, leave their state alone
    if (!authState || authState.id !== sessionBeforeRefresh.id) {
      return false
    }

    if (authState.needsRelogin) {
      await this.commitSession({ ...authState, needsRelogin: false })
    }

    return true
  }

  refreshAuthSession = () => {
    if (this.refreshSessionPromise) {
      return this.refreshSessionPromise
    }

    const promise = this.refreshAuthState().finally(() => {
      if (this.refreshSessionPromise === promise) {
        this.refreshSessionPromise = null
      }
    })

    this.refreshSessionPromise = promise

    return promise
  }

  refreshOnUnauthorized = async (response: HttpClientResponse) => {
    if (response.status !== 401) {
      return response
    }

    const session = await this.getSession()

    if (!session) {
      return response
    }

    const refreshedSinceRequest =
      response.config.authEpoch !== undefined &&
      response.config.authEpoch !== this.refreshEpoch

    if (!refreshedSinceRequest) {
      try {
        const didApply = await this.refreshAuthSession()

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

        await this.flagSessionForRelogin(session.id)

        return response
      }
    }

    // Retry once with the refreshed cookie; skip interceptors so a persistent
    // 401 propagates to the caller instead of re-triggering another refresh.
    return this.fetch(response.config.input, {
      ...response.config,
      useInterceptors: false,
    })
  }
}
