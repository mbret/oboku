import type {
  ApiClient,
  AuthCompleteMagicLinkData,
  AuthSignInWithEmailData,
  AuthSignInWithGoogleData,
} from "@oboku/shared"
import {
  authCompleteMagicLink,
  authLogout,
  authSignInWithEmail,
  authSignInWithGoogle,
  createApiClient,
} from "@oboku/shared"
import type { Profile } from "../profiles/types"
import { API_URL } from "../config"
import { withAuthCookiesLock } from "./authCookiesLock"
import { persistProofKey, type StoredProofKey } from "../auth/proofKey"
import {
  type FetchConfig,
  HttpClientError,
  RefreshingHttpClient,
} from "./httpClient.shared"
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
   * carries the session cookies, is replayed once after a refresh on a 401
   * unless `useInterceptors` is `false`, and fails with an `HttpClientError`
   * holding the parsed body, like every other call. The body is read into a
   * string so the replay can send it again.
   */
  private sendGeneratedRequest = async (
    input: RequestInfo | URL,
    init?: RequestInit,
    { useInterceptors }: Pick<FetchConfig, "useInterceptors"> = {},
  ): Promise<Response> => {
    const request = new Request(input, init)
    const { response, status, config } = await this.fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body ? await request.text() : undefined,
      signal: request.signal,
      unwrap: false,
      useInterceptors,
    })

    if (status >= 400) {
      throw new HttpClientError(
        await this.createResponse(response, { ...config, unwrap: true }),
        undefined,
      )
    }

    return response
  }

  /**
   * The `fetch` to pass to the generated API functions of the routes that
   * start or end a session, so their 401 reaches the caller instead of
   * refreshing the session and replaying them.
   */
  private sendGeneratedRequestWithoutRefresh = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => this.sendGeneratedRequest(input, init, { useInterceptors: false })

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
      authCompleteMagicLink({
        client: this.sdkClient,
        fetch: this.sendGeneratedRequestWithoutRefresh,
        body: data,
      }),
    )

  signInWithEmail = (
    data: AuthSignInWithEmailData["body"],
    proofKey: StoredProofKey,
  ) =>
    this.establishSession(proofKey, () =>
      authSignInWithEmail({
        client: this.sdkClient,
        fetch: this.sendGeneratedRequestWithoutRefresh,
        body: data,
      }),
    )

  signInWithGoogle = (
    data: AuthSignInWithGoogleData["body"],
    proofKey: StoredProofKey,
  ) =>
    this.establishSession(proofKey, () =>
      authSignInWithGoogle({
        client: this.sdkClient,
        fetch: this.sendGeneratedRequestWithoutRefresh,
        body: data,
      }),
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
    authLogout({
      client: this.sdkClient,
      fetch: this.sendGeneratedRequestWithoutRefresh,
      body: { session_id: sessionId },
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
