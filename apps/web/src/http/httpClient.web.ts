import { HttpClient } from "./httpClient.shared"

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

export class HttpClientWeb extends HttpClient {
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

export const httpClientWeb = new HttpClientWeb()
