import type {
  AuthSessionResponse,
  CompleteMagicLinkRequest,
  CompleteMagicLinkResponse,
  CompleteSignUpRequest,
  CompleteSignUpResponse,
  DeleteAccountResponse,
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
import { withAuthCookiesLock } from "./authCookiesLock"
import { signRefreshProof } from "../auth/proofKey"
import { HttpClientError, RefreshingHttpClient } from "./httpClient.shared"

export type SessionStore = {
  get: () => Promise<Profile | null>
  set: (session: Profile) => Promise<void>
}

const refreshTokenWasRejected = (error: unknown) =>
  error instanceof HttpClientError &&
  (error.response?.status === 401 || error.response?.status === 403)

export class HttpApiClientWeb extends RefreshingHttpClient {
  private sessionStore: SessionStore = {
    get: async () => null,
    set: async () => {},
  }

  constructor() {
    super({ credentials: "include" })
  }

  configureSessionStore = (store: SessionStore) => {
    this.sessionStore = store
  }

  private getSession = () => this.sessionStore.get()

  private commitSession = (session: Profile) => this.sessionStore.set(session)

  authWithMagicLink = (data: CompleteMagicLinkRequest) =>
    withAuthCookiesLock(() =>
      this.postOrThrow<CompleteMagicLinkResponse, CompleteMagicLinkRequest>(
        `${API_URL}/auth/magic-link/complete`,
        {
          body: data,
          useInterceptors: false,
        },
      ),
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
    withAuthCookiesLock(() =>
      this.postOrThrow<AuthSessionResponse, SignInWithEmailRequest>(
        `${API_URL}/auth/signin/email`,
        {
          body: data,
          useInterceptors: false,
        },
      ),
    )

  signInWithGoogle = (data: SignInWithGoogleRequest) =>
    withAuthCookiesLock(() =>
      this.postOrThrow<AuthSessionResponse, SignInWithGoogleRequest>(
        `${API_URL}/auth/signin/google`,
        {
          body: data,
          useInterceptors: false,
        },
      ),
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
  refreshToken = () =>
    withAuthCookiesLock(async () => {
      const url = `${API_URL}/auth/token?grant_type=refresh_token`
      const proof = await signRefreshProof(url)

      return this.postOrThrow<RefreshTokenResponse, never>(url, {
        headers: proof ? { DPoP: proof } : {},
        useInterceptors: false,
      })
    })

  /**
   * Revokes the server-side refresh session and clears the auth cookies. The
   * refresh cookie is the credential, so interceptors are skipped: no refresh-
   * on-401 dance for a session being killed.
   */
  logout = () =>
    withAuthCookiesLock(() =>
      this.postOrThrow<LogoutResponse>(`${API_URL}/auth/logout`, {
        useInterceptors: false,
      }),
    )

  deleteAccount = () =>
    this.fetchOrThrow<DeleteAccountResponse>(`${API_URL}/auth/account`, {
      method: "DELETE",
    })

  private flagSessionForRelogin = async (sessionId: string) => {
    const authState = await this.getSession()

    if (authState?.id === sessionId && !authState.needsRelogin) {
      await this.commitSession({ ...authState, needsRelogin: true })
    }
  }

  protected shouldAttemptRefresh = async () => !!(await this.getSession())

  protected applyRefresh = async () => {
    const sessionBeforeRefresh = await this.getSession()

    if (!sessionBeforeRefresh) {
      return false
    }

    try {
      await this.refreshToken()
    } catch (error) {
      console.log("Unable to refresh token")
      console.error(error)

      if (refreshTokenWasRejected(error)) {
        await this.flagSessionForRelogin(sessionBeforeRefresh.id)
      }

      throw error
    }

    this.markRefreshApplied()

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
}
