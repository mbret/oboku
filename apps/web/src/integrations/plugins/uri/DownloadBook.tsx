import { memo } from "react"
import { merge, takeUntil, throwIfEmpty, type Observable } from "rxjs"
import { useMutation$ } from "reactjrx"
import type { DownloadBookComponentProps } from "../types"
import { downloadThroughServerProxy } from "../../../download/downloadThroughServerProxy"
import { CancelError } from "../../../errors/errors.shared"
import { useHttpClientApi } from "../../../http"
import { useDownload } from "../../../http/useDownload"
import { fromAbortable } from "../../../common/rxjs/fromAbortable"
import { fromAbortSignal } from "../../../common/rxjs/fromAbortSignal"
import { useEffectWithUnmount$ } from "../../../common/rxjs/useEffectWithUnmount$"
import { scheduleDelayedEffect } from "../../../common/useDelayEffect"
import { downloadFromWebAddress, toUrlFileName } from "./download"

export const DownloadBook = memo(function DownloadBook({
  link,
  onDownloadProgress,
  onError,
  onResolve,
  signal,
}: DownloadBookComponentProps<"URI">) {
  const { mutateAsync: downloadBlob } = useDownload({
    meta: { suppressGlobalErrorToast: true },
  })
  const httpClientApi = useHttpClientApi()
  const { mutate: download } = useMutation$({
    mutationFn: function downloadBookFile({
      onUnmount$,
    }: {
      onUnmount$: Observable<void>
    }) {
      const { url, proxyThroughServer } = link.data

      return fromAbortable(function downloadUntilCancelled(downloadSignal) {
        return proxyThroughServer
          ? downloadThroughServerProxy({
              httpClientApi,
              linkId: link._id,
              fallbackFileName: toUrlFileName(url),
              onDownloadProgress,
              signal: downloadSignal,
            })
          : downloadFromWebAddress({
              url,
              download: downloadBlob,
              onDownloadProgress,
              signal: downloadSignal,
            })
      }).pipe(
        takeUntil(merge(fromAbortSignal(signal), onUnmount$)),
        throwIfEmpty(function toCancelError() {
          return new CancelError()
        }),
      )
    },
    onSuccess: onResolve,
    onError,
    meta: { suppressGlobalErrorToast: true },
  })

  useEffectWithUnmount$(
    function downloadOnceMounted(onUnmount$) {
      return scheduleDelayedEffect(function startDownload() {
        download({ onUnmount$ })
      }, 1)
    },
    [download],
  )

  return null
})
