import type {
  ApiClient,
  AuthCompleteMagicLinkData,
  AuthCompleteMagicLinkResponse,
  AuthCompleteSignUpData,
  AuthCompleteSignUpResponse,
  AuthDeleteAccountResponse,
  AuthLogoutData,
  AuthLogoutResponse,
  AuthRequestMagicLinkData,
  AuthRequestMagicLinkResponse,
  AuthRequestSignUpData,
  AuthRequestSignUpResponse,
  AuthSignInWithEmailData,
  AuthSignInWithEmailResponse,
  AuthSignInWithGoogleData,
  AuthSignInWithGoogleResponse,
  BooksRefreshMetadataData,
  BooksRefreshMetadataResponse,
  CollectionsRefreshMetadataData,
  CollectionsRefreshMetadataResponse,
  DataSourcesSyncData,
  DataSourcesSyncResponse,
  KoreaderSyncConnectionConnectData,
  KoreaderSyncConnectionConnectResponse,
  KoreaderSyncConnectionDisconnectResponse,
  KoreaderSyncServerCreatePasswordResponse,
  KoreaderSyncServerTurnOffResponse,
} from "@oboku/shared"
import { createApiClient } from "@oboku/shared"
import type { Profile } from "../profiles/types"
import { API_URL } from "../config"
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

  /**
   * Sends a request of the generated API functions through this client, so it
   * carries the session cookies, is replayed once after a refresh on a 401,
   * and fails with an `HttpClientError` holding the parsed body, like every
   * other call. The body is read into a string so the replay can send it again.
   */
  private sendGeneratedRequest = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init)
    const { response, status, config } = await this.fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body ? await request.text() : undefined,
      signal: request.signal,
      unwrap: false,
    })

    if (status >= 400) {
      throw new HttpClientError(
        await this.createResponse(response, { ...config, unwrap: true }),
        undefined,
      )
    }

    return response
  }

  /** The `client` to pass to the generated API functions. */
  sdkClient: ApiClient = createApiClient({
    baseUrl: API_URL,
    throwOnError: true,
    fetch: this.sendGeneratedRequest,
  })

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
    data: AuthCompleteMagicLinkData["body"],
    proofKey: StoredProofKey,
  ) =>
    this.establishSession(proofKey, () =>
      this.postOrThrow<
        AuthCompleteMagicLinkResponse,
        AuthCompleteMagicLinkData["body"]
      >(`${API_URL}/auth/magic-link/complete`, {
        body: data,
        useInterceptors: false,
      }),
    )

  refreshBookMetadata = (params: BooksRefreshMetadataData["body"]) =>
    this.postOrThrow<
      BooksRefreshMetadataResponse,
      BooksRefreshMetadataData["body"]
    >(`${API_URL}/books/metadata/refresh`, {
      body: params,
    })

  refreshCollectionMetadata = (
    params: CollectionsRefreshMetadataData["body"],
  ) =>
    this.postOrThrow<
      CollectionsRefreshMetadataResponse,
      CollectionsRefreshMetadataData["body"]
    >(`${API_URL}/collections/metadata/refresh`, {
      body: { ...params, soft: params.soft ?? false },
    })

  syncDataSource = (params: DataSourcesSyncData["body"]) =>
    this.postOrThrow<DataSourcesSyncResponse, DataSourcesSyncData["body"]>(
      `${API_URL}/datasources/sync`,
      {
        body: params,
      },
    )

  signInWithEmail = (
    data: AuthSignInWithEmailData["body"],
    proofKey: StoredProofKey,
  ) =>
    this.establishSession(proofKey, () =>
      this.postOrThrow<
        AuthSignInWithEmailResponse,
        AuthSignInWithEmailData["body"]
      >(`${API_URL}/auth/signin/email`, {
        body: data,
        useInterceptors: false,
      }),
    )

  signInWithGoogle = (
    data: AuthSignInWithGoogleData["body"],
    proofKey: StoredProofKey,
  ) =>
    this.establishSession(proofKey, () =>
      this.postOrThrow<
        AuthSignInWithGoogleResponse,
        AuthSignInWithGoogleData["body"]
      >(`${API_URL}/auth/signin/google`, {
        body: data,
        useInterceptors: false,
      }),
    )

  signUp = (data: AuthRequestSignUpData["body"]) =>
    this.postOrThrow<AuthRequestSignUpResponse, AuthRequestSignUpData["body"]>(
      `${API_URL}/auth/signup`,
      {
        body: data,
      },
    )

  completeSignUp = (data: AuthCompleteSignUpData["body"]) =>
    this.postOrThrow<
      AuthCompleteSignUpResponse,
      AuthCompleteSignUpData["body"]
    >(`${API_URL}/auth/signup/complete`, {
      body: data,
    })

  requestMagicLink = (data: AuthRequestMagicLinkData["body"]) =>
    this.postOrThrow<
      AuthRequestMagicLinkResponse,
      AuthRequestMagicLinkData["body"]
    >(`${API_URL}/auth/magic-link`, {
      body: data,
    })

  createKoreaderSyncServerPassword = () =>
    this.postOrThrow<KoreaderSyncServerCreatePasswordResponse>(
      `${API_URL}/koreader-sync-server/password`,
    )

  turnOffKoreaderSyncServer = () =>
    this.fetchOrThrow<KoreaderSyncServerTurnOffResponse>(
      `${API_URL}/koreader-sync-server`,
      { method: "DELETE" },
    )

  connectKoreaderSyncServer = (
    body: KoreaderSyncConnectionConnectData["body"],
  ) =>
    this.fetchOrThrow<KoreaderSyncConnectionConnectResponse>(
      `${API_URL}/koreader-sync-connection`,
      {
        method: "PUT",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      },
    )

  disconnectKoreaderSyncServer = () =>
    this.fetchOrThrow<KoreaderSyncConnectionDisconnectResponse>(
      `${API_URL}/koreader-sync-connection`,
      { method: "DELETE" },
    )

  refreshToken = () => refreshTokenRequest(this, API_URL)

  /**
   * Revokes exactly the session identified by `sessionId`, regardless of which
   * refresh cookie currently sits in the jar. The server does not touch cookies
   * on this path, so it needs no cookies lock and cannot revoke a newer
   * session's chain. Interceptors are skipped: no refresh-on-401 dance for a
   * session being killed.
   */
  logout = (sessionId: string) =>
    this.postOrThrow<AuthLogoutResponse, AuthLogoutData["body"]>(
      `${API_URL}/auth/logout`,
      {
        body: { session_id: sessionId },
        useInterceptors: false,
      },
    )

  deleteAccount = () =>
    this.fetchOrThrow<AuthDeleteAccountResponse>(`${API_URL}/auth/account`, {
      method: "DELETE",
    })

  private flagSessionForRelogin = async (sessionId: string) => {
    const authState = await this.getSession()

    if (authState?.sessionId === sessionId && !authState.needsRelogin) {
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
        await this.flagSessionForRelogin(sessionBeforeRefresh.sessionId)
      }

      throw error
    }

    this.markRefreshApplied()

    const authState = await this.getSession()

    // the session changed hands while refreshing; the fresh cookies belong to
    // whoever is active now, leave their state alone. A same-account relogin
    // mints a new sessionId, so keying on it (not the account id) treats that
    // fresh session as a different owner too.
    if (!authState || authState.sessionId !== sessionBeforeRefresh.sessionId) {
      return false
    }

    if (authState.needsRelogin) {
      await this.commitSession({ ...authState, needsRelogin: false })
    }

    return true
  }
}
