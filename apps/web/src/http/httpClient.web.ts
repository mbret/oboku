import { Observable } from "rxjs"
import { HttpClient } from "./httpClient.shared"
import { CancelError } from "../errors/errors.shared"

type XMLHttpResponseError = {
  status: number
  statusText: string
  __xmlerror: true
}

/**
 * Transport-level failure surfaced by `XMLHttpRequest`'s `onerror`:
 * DNS failure, refused connection, CORS preflight rejection, etc.
 * The http client only knows it couldn't reach the wire; translation
 * to any domain-level error is the caller's job.
 */
export class HttpClientNetworkError extends Error {
  constructor(message = "HttpClientNetworkError") {
    super(message)
    this.name = "HttpClientNetworkError"
  }
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
  headers?: Record<string, string>
  signal?: AbortSignal
  responseType: XMLHttpRequestResponseType
  onDownloadProgress: (event: ProgressEvent<EventTarget>) => void
}

export type UploadParams = {
  url: string
  method?: "POST" | "PUT" | "PATCH"
  body: Blob | File | ArrayBuffer | string
  headers?: Record<string, string>
  signal?: AbortSignal
  onUploadProgress?: (event: ProgressEvent<EventTarget>) => void
}

export type XhrResponse<T> = {
  data: T
  headers: Record<string, string>
  status: number
  statusText: string
}

export type UploadResponse = XhrResponse<string>

type XhrParams = {
  url: string
  method: string
  headers?: Record<string, string>
  signal?: AbortSignal
  body?: Blob | File | ArrayBuffer | string
  responseType?: XMLHttpRequestResponseType
  onUploadProgress?: (event: ProgressEvent<EventTarget>) => void
  onDownloadProgress?: (event: ProgressEvent<EventTarget>) => void
}

export const sendXhr = <T>(
  {
    url,
    method,
    headers = {},
    signal,
    body,
    responseType,
    onUploadProgress,
    onDownloadProgress,
  }: XhrParams,
  unwrap: (xhr: XMLHttpRequest) => T,
) =>
  new Promise<XhrResponse<T>>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const handleAbort = () => xhr.abort()
    const cleanup = () => signal?.removeEventListener("abort", handleAbort)

    xhr.open(method, url)

    if (responseType !== undefined) xhr.responseType = responseType

    Object.keys(headers).forEach((key) => {
      const value = headers[key]
      if (value !== undefined) xhr.setRequestHeader(key, value)
    })

    if (onUploadProgress) xhr.upload.onprogress = onUploadProgress
    if (onDownloadProgress) xhr.onprogress = onDownloadProgress

    signal?.addEventListener("abort", handleAbort, { once: true })

    xhr.onload = () => {
      cleanup()

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          data: unwrap(xhr),
          headers: parseXmlHttpResponseHeaders(xhr.getAllResponseHeaders()),
          status: xhr.status,
          statusText: xhr.statusText,
        })
      } else {
        reject({
          status: xhr.status,
          statusText: xhr.statusText || xhr.responseText,
          __xmlerror: true,
        } satisfies XMLHttpResponseError)
      }
    }

    xhr.onerror = () => {
      cleanup()
      reject(new HttpClientNetworkError())
    }

    xhr.onabort = () => {
      cleanup()
      reject(new CancelError())
    }

    xhr.send(body)
  })

export class HttpClientWeb extends HttpClient {
  upload = ({ method = "POST", ...rest }: UploadParams) =>
    sendXhr<string>({ ...rest, method }, (xhr) => xhr.responseText)

  upload$ = (params: Omit<UploadParams, "signal">) =>
    new Observable<UploadResponse>((subscriber) => {
      const controller = new AbortController()

      this.upload({ ...params, signal: controller.signal }).then(
        (response) => {
          subscriber.next(response)
          subscriber.complete()
        },
        (error) => subscriber.error(error),
      )

      return () => controller.abort()
    })
}

export const httpClientWeb = new HttpClientWeb()
