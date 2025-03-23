import { authStateSignal } from "../auth/authState"
import { configuration } from "../config/configuration"
import { API_URL } from "../constants.shared"
import { HttpClientError } from "./HttpClientError.shared"

type FetchParams = NonNullable<Parameters<typeof fetch>[1]>

type XMLHttpResponseError = {
  status: number
  statusText: string
  __xmlerror: true
}

export const isXMLHttpResponseError = (
  error: unknown,
): error is XMLHttpResponseError => {
  if (error && typeof error === "object" && "__xmlerror" in error) return true

  return false
}

class HttpClient {
  fetch = async <T>({
    url,
    withAuth = true,
    ...params
  }: FetchParams & {
    url: string
    withAuth?: boolean
  }): Promise<{ data: T }> => {
    const authState = authStateSignal.getValue()

    const response = await fetch(url, {
      ...params,
      headers: {
        ...(authState?.token &&
          withAuth && {
            Authorization: `Bearer ${authState?.token}`,
          }),
        ...params.headers,
      },
    })

    const data = await response.json()

    if (response.status >= 400) throw new HttpClientError({ response, data })

    return { data }
  }

  post = async <T>(
    options: Omit<FetchParams, "body" | "method"> & {
      url: string
      body: Record<string, unknown>
    },
  ) => {
    return this.fetch<T>({
      ...options,
      method: "post",
      body: JSON.stringify(options.body),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  refreshBookMetadata = (
    bookId: string,
    credentials?: { [key: string]: any },
  ) =>
    this.post({
      url: `${API_URL}/books/metadata/refresh`,
      body: { bookId },
      headers: {
        "oboku-credentials": JSON.stringify(credentials ?? {}),
      },
    })

  refreshCollectionMetadata = (
    collectionId: string,
    credentials?: { [key: string]: any },
  ) =>
    this.post({
      url: `${API_URL}/collections/metadata/refresh`,
      body: { collectionId },
      headers: {
        "oboku-credentials": JSON.stringify(credentials ?? {}),
      },
    })

  syncDataSource = (
    dataSourceId: string,
    credentials?: { [key: string]: any },
  ) =>
    this.post({
      url: `${API_URL}/datasources/sync`,
      body: { dataSourceId },
      headers: {
        "oboku-credentials": JSON.stringify(credentials),
      },
    })

  signIn = (token: string) =>
    this.post<{
      dbName: string
      email: string
      token: string
      nameHex: string
    }>({
      url: `${configuration.API_URL}/auth/signin`,
      body: {
        token,
      },
    })

  download = <T>({
    url,
    responseType,
    onDownloadProgress,
    headers = {},
  }: {
    url: string
    responseType: XMLHttpRequestResponseType
    onDownloadProgress: (event: ProgressEvent<EventTarget>) => void
  } & Parameters<typeof fetch>[1]) => {
    return new Promise<{ data: T; status: number; statusText: string }>(
      (resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.open("GET", url)

        xhr.responseType = responseType

        Object.keys(headers).forEach((key) => {
          // @ts-expect-error
          xhr.setRequestHeader(key, headers[key])
        })

        xhr.send()

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = xhr.response
            resolve({ data, status: xhr.status, statusText: xhr.statusText })
          } else {
            reject({
              status: xhr.status,
              statusText: xhr.statusText,
              __xmlerror: true,
            } satisfies XMLHttpResponseError)
          }
        }

        xhr.onprogress = onDownloadProgress

        xhr.onerror = () => {
          // handle non-HTTP error (e.g. network down)
          /**
           * Failing with status 0 and text `` after downloading a couple of mb
           * may indicate a low storage device. It can be detected to display
           * related error message
           */
          reject({
            status: xhr.status,
            statusText: xhr.statusText,
            __xmlerror: true,
          } satisfies XMLHttpResponseError)
        }
      },
    )
  }
}

export const httpClient = new HttpClient()
