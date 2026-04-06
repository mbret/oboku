export class HttpClientError extends Error {
  constructor(
    public response: HttpClientResponse | undefined,
    public originalError: unknown | undefined,
  ) {
    if (response) {
      super(
        `Response error with status ${response.status} for ${response.response.url}`,
      )
    } else {
      super(
        originalError instanceof Error
          ? originalError.message
          : "Unknown error",
      )
    }
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
  clientId?: string
  unwrap?: boolean
  useInterceptors?: boolean
}

export class HttpClient {
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

    const { clientId: _clientId, unwrap = true, ...params } = interceptedConfig

    let response: Response

    try {
      response = await fetch(input, {
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

export const httpClient = new HttpClient()
