export class HttpClientError extends Error {
  response: HttpClientResponse | undefined
  originalError: unknown | undefined

  constructor(
    response: HttpClientResponse | undefined,
    originalError: unknown | undefined,
  ) {
    const message = response
      ? `Response error with status ${response.status} for ${response.response.url}`
      : originalError instanceof Error
        ? originalError.message
        : "Unknown error"

    super(message)

    this.name = "HttpClientError"
    this.response = response
    this.originalError = originalError
  }
}

export type HttpClientResponse<T = unknown> = {
  response: Response
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: FetchConfig
}

export type FetchConfig = RequestInit & {
  input: string | URL | globalThis.Request
  unwrap?: boolean
  useInterceptors?: boolean
  /**
   * Refresh epoch the request was sent under (stamped by the api client), so
   * a 401 can tell whether the session was already refreshed since.
   */
  authEpoch?: number
}

export class HttpClient {
  /**
   * @param baseRequestInit merged under every request's own init — e.g.
   * `{ credentials: "include" }` for clients whose auth rides on cookies.
   * Applied even when interceptors are skipped.
   */
  constructor(private baseRequestInit: RequestInit = {}) {}

  private interceptors: {
    request?: (request: FetchConfig) => Promise<FetchConfig>
    response?: (response: HttpClientResponse) => Promise<HttpClientResponse>
    error?: (
      error: HttpClientError,
    ) => Promise<HttpClientError | HttpClientResponse>
  }[] = []

  interceptResponse = async (
    response: HttpClientResponse | HttpClientError,
  ) => {
    let interceptedResponse = response

    for (const interceptor of this.interceptors) {
      if (interceptedResponse instanceof HttpClientError) {
        interceptedResponse =
          (await interceptor.error?.(interceptedResponse).catch((error) => {
            if (error instanceof HttpClientError) {
              return error
            }

            throw error
          })) ?? interceptedResponse
      } else {
        interceptedResponse =
          (await interceptor.response?.(interceptedResponse).catch((error) => {
            if (error instanceof HttpClientError) {
              return error
            }

            throw error
          })) ?? interceptedResponse
      }
    }

    return interceptedResponse
  }

  async createResponse<T>(
    response: Response,
    config: FetchConfig,
  ): Promise<HttpClientResponse<T>> {
    const isJson = response.headers
      .get("Content-Type")
      ?.includes("application/json")

    const data = config.unwrap && isJson ? await response.json() : undefined

    return {
      response,
      data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config,
    }
  }

  fetch = async (
    input: string | URL | globalThis.Request,
    config: Omit<FetchConfig, "input"> = {},
  ): Promise<HttpClientResponse<unknown>> => {
    const interceptedConfig =
      config.useInterceptors === false
        ? { ...config, input }
        : await this.interceptors.reduce(
            async (promise, interceptor) => {
              const acc = await promise

              return interceptor.request?.(acc) ?? acc
            },
            Promise.resolve({ ...config, input }),
          )

    const {
      unwrap = true,
      authEpoch: _authEpoch,
      ...params
    } = interceptedConfig

    let response: Response

    try {
      response = await fetch(input, {
        ...this.baseRequestInit,
        ...params,
      })
    } catch (error) {
      const interceptedError =
        interceptedConfig.useInterceptors === false
          ? new HttpClientError(undefined, error)
          : await this.interceptResponse(new HttpClientError(undefined, error))

      if (interceptedError instanceof HttpClientError) {
        throw interceptedError
      }

      return interceptedError as HttpClientResponse<unknown>
    }

    const httpResponse = await this.createResponse(response, {
      ...interceptedConfig,
      unwrap,
    })

    const interceptedResponseOrError =
      interceptedConfig.useInterceptors === false
        ? httpResponse
        : await this.interceptResponse(httpResponse)

    if (interceptedResponseOrError instanceof HttpClientError) {
      throw interceptedResponseOrError
    }

    return interceptedResponseOrError as HttpClientResponse<unknown>
  }

  fetchOrThrow = async <T>(
    input: string | URL | globalThis.Request,
    config: Omit<FetchConfig, "input"> = {},
  ): Promise<HttpClientResponse<T>> => {
    const response = await this.fetch(input, config)

    if (response.status >= 400) {
      throw new HttpClientError(response, undefined)
    }

    return response as HttpClientResponse<T>
  }

  postOrThrow = async <T, Body extends Record<string, unknown>>(
    input: string | URL | globalThis.Request,
    options: Omit<FetchConfig, "body" | "method" | "input"> & {
      body?: Body
    } = {},
  ) => {
    return this.fetchOrThrow<T>(input, {
      ...options,
      method: "post",
      body: JSON.stringify(options.body),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  useInterceptors = (
    request?: (request: FetchConfig) => Promise<FetchConfig>,
    response?: (response: HttpClientResponse) => Promise<HttpClientResponse>,
    error?: (
      error: HttpClientError,
    ) => Promise<HttpClientError | HttpClientResponse>,
  ) => {
    const interceptor = { request, response, error }
    this.interceptors.push(interceptor)

    return () => {
      this.interceptors = this.interceptors.filter(
        (entry) => entry !== interceptor,
      )
    }
  }

  useResponseInterceptor = (
    response: (response: HttpClientResponse) => Promise<HttpClientResponse>,
    error?: (
      error: HttpClientError,
    ) => Promise<HttpClientError | HttpClientResponse>,
  ) => {
    return this.useInterceptors(undefined, response, error)
  }

  useRequestInterceptor = (
    request: (request: FetchConfig) => Promise<FetchConfig>,
  ) => {
    return this.useInterceptors(request)
  }
}

/**
 * Transport client that transparently refreshes the session on a 401 and
 * replays the failed request once. The mechanics — stamping each request with
 * the current refresh epoch, deduplicating concurrent refreshes into a single
 * in-flight call, gating on whether a refresh already happened since the
 * request, and retrying exactly once with interceptors disabled — live here so
 * every context (window, service worker) shares one implementation. What a
 * refresh actually *does*, and whether a given 401 is even worth refreshing
 * for, is left to subclasses.
 */
export abstract class RefreshingHttpClient extends HttpClient {
  private refreshInFlight: Promise<boolean> | null = null
  /** Bumped after every applied refresh; see `FetchConfig.authEpoch`. */
  private refreshEpoch = 0

  constructor(baseRequestInit: RequestInit = {}) {
    super(baseRequestInit)

    // biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
    this.useRequestInterceptor(this.stampAuthEpoch)
    // biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
    this.useResponseInterceptor(this.refreshOnUnauthorized)
  }

  /**
   * Perform the token refresh network call. Resolve `true` when a fresh
   * session was applied and the failed request should be replayed, `false` to
   * leave the 401 untouched, or throw to signal the refresh itself failed.
   * Call `markRefreshApplied()` the moment fresh cookies are in place.
   */
  protected abstract applyRefresh(): Promise<boolean>

  /** Whether a 401 warrants a refresh attempt at all (default: always). */
  protected shouldAttemptRefresh(): Promise<boolean> {
    return Promise.resolve(true)
  }

  protected markRefreshApplied() {
    this.refreshEpoch++
  }

  private stampAuthEpoch = async (
    config: FetchConfig,
  ): Promise<FetchConfig> => ({
    ...config,
    authEpoch: this.refreshEpoch,
  })

  refreshAuthSession = (): Promise<boolean> => {
    if (this.refreshInFlight) {
      return this.refreshInFlight
    }

    const promise = this.applyRefresh().finally(() => {
      if (this.refreshInFlight === promise) {
        this.refreshInFlight = null
      }
    })

    this.refreshInFlight = promise

    return promise
  }

  refreshOnUnauthorized = async (
    response: HttpClientResponse,
  ): Promise<HttpClientResponse> => {
    if (response.status !== 401) {
      return response
    }

    if (!(await this.shouldAttemptRefresh())) {
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
      } catch {
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

export const httpClient = new HttpClient()
