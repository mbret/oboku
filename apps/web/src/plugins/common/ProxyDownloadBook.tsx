import { memo } from "react"
import { useMutation$ } from "reactjrx"
import {
  from,
  merge,
  takeUntil,
  tap,
  throwIfEmpty,
  type Observable,
} from "rxjs"
import { fromAbortSignal } from "../../common/rxjs/fromAbortSignal"
import { useEffectWithUnmount$ } from "../../common/rxjs/useEffectWithUnmount$"
import { scheduleDelayedEffect } from "../../common/useDelayEffect"
import { CancelError } from "../../errors/errors.shared"
import { useHttpClientApi } from "../../http"
import type {
  DownloadBookComponentProps,
  UseDownloadCredentialsHook,
} from "../types"

const readBodyWithProgress = async (
  response: Response,
  onDownloadProgress: (progress: number) => void,
  signal: AbortSignal,
) => {
  const body = response.body

  if (!body) {
    return await response.blob()
  }

  const reportedLength = Number(response.headers.get("content-length"))
  const totalBytes = Number.isFinite(reportedLength) ? reportedLength : 0
  const reader = body.getReader()
  const chunks: BlobPart[] = []
  let receivedBytes = 0

  while (!signal.aborted) {
    const { done, value } = await reader.read()

    if (done) break
    if (!value) continue

    chunks.push(value as BlobPart)
    receivedBytes += value.byteLength

    if (totalBytes > 0) {
      onDownloadProgress(receivedBytes / totalBytes)
    }
  }

  if (signal.aborted) {
    await reader.cancel()

    throw new CancelError()
  }

  return new Blob(chunks)
}

type ProxyDownloadBookProps = DownloadBookComponentProps & {
  fileName: string
  useDownloadCredentials: UseDownloadCredentialsHook
}

/**
 * Downloads a book by having the API fetch it, for providers whose servers
 * would fail the browser's cross-origin check. Reads the response stream
 * itself so progress stays reported like the direct plugin components do.
 */
export const ProxyDownloadBook = memo(function ProxyDownloadBook({
  link,
  onDownloadProgress,
  onError,
  onResolve,
  signal,
  fileName,
  useDownloadCredentials,
}: ProxyDownloadBookProps) {
  const httpClientApi = useHttpClientApi()
  const { mutateAsync: resolveCredentials } = useDownloadCredentials()

  const { mutate: download } = useMutation$({
    mutationFn: ({ onUnmount$ }: { onUnmount$: Observable<void> }) => {
      const abortController = new AbortController()

      const cancel$ = merge(fromAbortSignal(signal), onUnmount$).pipe(
        tap(function abortProxiedDownload() {
          abortController.abort()
        }),
      )

      const downloadThroughApi = async () => {
        const { providerCredentials } = await resolveCredentials({
          linkData: link.data,
        })

        const { response } = await httpClientApi.downloadLink({
          linkId: link._id,
          providerCredentials,
        })

        return {
          data: await readBodyWithProgress(
            response,
            onDownloadProgress,
            abortController.signal,
          ),
          fileName,
        }
      }

      return from(downloadThroughApi()).pipe(
        takeUntil(cancel$),
        throwIfEmpty(() => new CancelError()),
      )
    },
    onSuccess: onResolve,
    onError,
    meta: { suppressGlobalErrorToast: true },
  })

  useEffectWithUnmount$(
    (onUnmount$) => scheduleDelayedEffect(() => download({ onUnmount$ }), 1),
    [download],
  )

  return null
})
