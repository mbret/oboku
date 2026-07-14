import { memo } from "react"
import {
  from,
  map,
  merge,
  takeUntil,
  tap,
  throwIfEmpty,
  type Observable,
} from "rxjs"
import { useMutation$ } from "reactjrx"
import { resolveDownloadFileName } from "@oboku/shared"
import type { DownloadBookComponentProps } from "../types"
import { CancelError } from "../../errors/errors.shared"
import { useDownload } from "../../http/useDownload"
import { fromAbortSignal } from "../../common/rxjs/fromAbortSignal"
import { useEffectWithUnmount$ } from "../../common/rxjs/useEffectWithUnmount$"
import { scheduleDelayedEffect } from "../../common/useDelayEffect"

export const DownloadBook = memo(
  ({
    link,
    onDownloadProgress,
    onError,
    onResolve,
    signal,
  }: DownloadBookComponentProps<"URI">) => {
    const { mutateAsync: downloadBlob } = useDownload({
      meta: { suppressGlobalErrorToast: true },
    })
    const { mutate: download } = useMutation$({
      mutationFn: ({ onUnmount$ }: { onUnmount$: Observable<void> }) => {
        const abortController = new AbortController()

        const cancel$ = merge(fromAbortSignal(signal), onUnmount$).pipe(
          tap(() => abortController.abort()),
        )

        const downloadLink = link.data.url

        return from(
          downloadBlob({
            responseType: "blob",
            signal: abortController.signal,
            url: downloadLink,
            onDownloadProgress: (event) => {
              onDownloadProgress(event.loaded / (event.total ?? 1))
            },
          }),
        ).pipe(
          map((mediaResponse) => {
            return {
              data: mediaResponse.data,
              fileName:
                resolveDownloadFileName({
                  contentDisposition:
                    mediaResponse.headers["content-disposition"],
                  url: downloadLink,
                }) || bookIdFromUrl(downloadLink),
            }
          }),
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
  },
)

const bookIdFromUrl = (url: string) => {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).pop() || url
  } catch {
    return url
  }
}
