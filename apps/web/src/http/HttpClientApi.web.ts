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
import { persistProofKey, type StoredProofKey } from "../auth/proofKey"
import { HttpClientError, RefreshingHttpClient } from "./httpClient.shared"
import { refreshTokenRequest } from "./refreshTokenRequest"

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

  /**
   * Runs a cookie-setting auth fetch and persists its proof key inside the same
   * cookies-lock hold. The browser writes the response's cookies and we persist
   * the matching key without releasing the lock in between, so the session
   * whose `Set-Cookie` lands last also owns the persisted key. Persisting after
   * the lock released instead would let two overlapping sign-ins pair one
   * session's cookies with the other's key, failing every future refresh with a
   * DPoP-key mismatch. The key is persisted only after a successful response,
   * so a rejected attempt never promotes a key the server did not bind.
   */
  private establishSession = <T>(
    proofKey: StoredProofKey,
    authenticate: () => Promise<T>,
  ): Promise<Awaited<T>> =>
    withAuthCookiesLock(async () => {
      const response = await authenticate()

      await persistProofKey(proofKey)

      return response
    })

  authWithMagicLink = (
    data: CompleteMagicLinkRequest,
    proofKey: StoredProofKey,
  ) =>
    this.establishSession(proofKey, () =>
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

  signInWithEmail = (data: SignInWithEmailRequest, proofKey: StoredProofKey) =>
    this.establishSession(proofKey, () =>
      this.postOrThrow<AuthSessionResponse, SignInWithEmailRequest>(
        `${API_URL}/auth/signin/email`,
        {
          body: data,
          useInterceptors: false,
        },
      ),
    )

  signInWithGoogle = (
    data: SignInWithGoogleRequest,
    proofKey: StoredProofKey,
  ) =>
    this.establishSession(proofKey, () =>
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

  refreshToken = () => refreshTokenRequest(this, API_URL)

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
