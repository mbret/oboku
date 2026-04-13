import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { HttpClient } from "./httpClient.shared"
import { CancelError } from "../errors/errors.shared"

type XMLHttpResponseError = {
  status: number
  statusText: string
  __xmlerror: true
}

const parseXmlHttpResponseHeaders = (headers: string) =>
  headers
    .trim()
    .split(/[\r\n]+/)
    .reduce<Record<string, string>>((acc, line) => {
      const separatorIndex = line.indexOf(":")

      if (separatorIndex === -1) {
        return acc
      }

      const key = line.slice(0, separatorIndex).trim().toLowerCase()
      const value = line.slice(separatorIndex + 1).trim()

      if (!key) {
        return acc
      }

      acc[key] = value

      return acc
    }, {})

export const isXMLHttpResponseError = (
  error: unknown,
): error is XMLHttpResponseError => {
  if (error && typeof error === "object" && "__xmlerror" in error) return true

  return false
}

export type DownloadParams = {
  url: string
  responseType: XMLHttpRequestResponseType
  onDownloadProgress: (event: ProgressEvent<EventTarget>) => void
} & Parameters<typeof fetch>[1]

export class HttpClientWeb extends HttpClient {
  download = <T>({
    signal,
    url,
    responseType,
    onDownloadProgress,
    headers = {},
  }: DownloadParams) => {
    return new Promise<{
      data: T
      headers: Record<string, string>
      status: number
      statusText: string
    }>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const handleAbort = () => {
        xhr.abort()
      }

      xhr.open("GET", url)

      xhr.responseType = responseType

      Object.keys(headers).forEach((key) => {
        // @ts-expect-error
        xhr.setRequestHeader(key, headers[key])
      })

      signal?.addEventListener("abort", handleAbort, {
        once: true,
      })

      xhr.send()

      xhr.onload = () => {
        signal?.removeEventListener("abort", handleAbort)

        if (xhr.status >= 200 && xhr.status < 300) {
          const data = xhr.response
          resolve({
            data,
            headers: parseXmlHttpResponseHeaders(xhr.getAllResponseHeaders()),
            status: xhr.status,
            statusText: xhr.statusText,
          })
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
        signal?.removeEventListener("abort", handleAbort)

        reject(
          new ObokuSharedError(ObokuErrorCode.ERROR_RESOURCE_NOT_REACHABLE),
        )
      }

      xhr.onabort = () => {
        signal?.removeEventListener("abort", handleAbort)
        reject(new CancelError())
      }
    })
  }
}

export const httpClientWeb = new HttpClientWeb()
