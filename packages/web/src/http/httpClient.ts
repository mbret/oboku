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

class HttpClient {
  fetch = async ({
    url,
    ...params
  }: Parameters<typeof fetch>[1] & {
    url: string
  }) => {
    const authState = authStateSignal.getValue()

    const response = await fetch(url, {
      ...params,
      headers: {
        ...(authState?.token && {
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

  refreshMetadata = (bookId: string, credentials?: { [key: string]: any }) =>
    this.fetch({
      url: `${API_URI}/refresh-metadata`,
      body: JSON.stringify({ bookId }),
      method: "post",
      headers: {
        "oboku-credentials": JSON.stringify(credentials)
      }
    })

  syncDataSource = (
    dataSourceId: string,
    credentials?: { [key: string]: any }
  ) =>
    this.fetch({
      url: `${API_URI}/sync-datasource`,
      method: "post",
      body: JSON.stringify({ dataSourceId }),
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
