import { authStateSignal } from "../auth/authState"
import { API_URI } from "../constants"

export class HttpClientError extends Error {
  constructor(
    public response: {
      data: unknown
    }
  ) {
    super("HttpClient response error")
    this.response = response
  }
}

type FetchParams = NonNullable<Parameters<typeof fetch>[1]>

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
            Authorization: `Bearer ${authState?.token}`
          }),
        ...params.headers
      }
    })

    const data = await response.json()

    if (response.status >= 400)
      throw new HttpClientError({
        ...response,
        data
      })

    return { data }
  }

  post = async (
    options: Omit<FetchParams, "body" | "method"> & {
      url: string
      body: Record<string, unknown>
    }
  ) => {
    return this.fetch({
      ...options,
      method: "post",
      body: JSON.stringify(options.body),
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      }
    })
  }

  refreshMetadata = (bookId: string, credentials?: { [key: string]: any }) =>
    this.post({
      url: `${API_URI}/refresh-metadata`,
      body: { bookId },
      headers: {
        "oboku-credentials": JSON.stringify(credentials)
      }
    })

  syncDataSource = (
    dataSourceId: string,
    credentials?: { [key: string]: any }
  ) =>
    this.post({
      url: `${API_URI}/sync-datasource`,
      body: { dataSourceId },
      headers: {
        "oboku-credentials": JSON.stringify(credentials)
      }
    })

  download = <T>({
    url,
    responseType,
    onDownloadProgress,
    headers = {}
  }: {
    url: string
    responseType: XMLHttpRequestResponseType
    onDownloadProgress: (event: ProgressEvent<EventTarget>) => void
  } & Parameters<typeof fetch>[1]) => {
    return new Promise<{ data: T }>((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.open("GET", url)

      xhr.responseType = responseType

      Object.keys(headers).forEach((key) => {
        xhr.setRequestHeader(key, headers[key])
      })

      xhr.send()

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = xhr.response
          resolve({ data })
        } else {
          reject({
            status: xhr.status,
            statusText: xhr.statusText
          })
        }
      }

      xhr.onprogress = onDownloadProgress

      xhr.onerror = function () {
        // handle non-HTTP error (e.g. network down)
      }
    })
  }
}

export const httpClient = new HttpClient()
