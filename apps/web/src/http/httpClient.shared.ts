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

type HttpClientResponse<T = unknown> = {
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
  validateStatus?: (status: number) => boolean
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

  fetch = async <T>(
    input: string | URL | globalThis.Request,
    config: Omit<FetchConfig, "input"> = {},
  ): Promise<HttpClientResponse<T>> => {
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
      validateStatus = (status: number) => status < 400,
      ...params
    } = interceptedConfig

    const response = await fetch(input, {
      ...params,
    })

    const httpResponse = await this.createResponse(response, {
      ...interceptedConfig,
      unwrap,
      validateStatus,
    })

    const responseOrError = !validateStatus(response.status)
      ? new HttpClientError(httpResponse, undefined)
      : httpResponse

    const interceptedResponseOrError =
      interceptedConfig.useInterceptors === false
        ? responseOrError
        : await this.interceptResponse(responseOrError)

    if (interceptedResponseOrError instanceof HttpClientError) {
      throw responseOrError
    }

    return interceptedResponseOrError as HttpClientResponse<T>
  }

  post = async <T, Body extends Record<string, unknown>>(
    input: string | URL | globalThis.Request,
    options: Omit<FetchConfig, "body" | "method" | "input"> & {
      body?: Body
    } = {},
  ) => {
    return this.fetch<T>(input, {
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
