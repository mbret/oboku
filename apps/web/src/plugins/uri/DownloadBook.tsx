import { memo, useEffect } from "react"
import {
  from,
  fromEvent,
  map,
  merge,
  of,
  ReplaySubject,
  takeUntil,
  tap,
  throwIfEmpty,
  type Observable,
} from "rxjs"
import { useMutation$ } from "reactjrx"
import {} from "@oboku/shared"
import { resolveDownloadFileName } from "@oboku/shared"
import {
  type DownloadBookComponentProps,
  extractIdFromResourceId,
} from "../types"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { CancelError, LifecycleCancelError } from "../../errors/errors.shared"
import { httpClientWeb } from "../../http/httpClient.web"

export const DownloadBook = memo(
  ({
    link,
    onDownloadProgress,
    onError,
    onResolve,
    signal,
  }: DownloadBookComponentProps) => {
    const { mutate: download } = useMutation$({
      mutationFn: ({ onUnmount$ }: { onUnmount$: Observable<void> }) => {
        const abortController = new AbortController()
        let cancelReason: "user" | "lifecycle" | null = null
        const userCancel$: Observable<unknown> = signal.aborted
          ? of(null)
          : fromEvent(signal, "abort")

        const userCancelWithFlag$ = userCancel$.pipe(
          tap(() => {
            cancelReason = "user"
            abortController.abort()
          }),
        )

        const lifecycleCancelWithFlag$ = onUnmount$.pipe(
          tap(() => {
            cancelReason = "lifecycle"
            abortController.abort()
          }),
        )

        const downloadLink = extractIdFromResourceId(
          UNIQUE_RESOURCE_IDENTIFIER,
          link.resourceId,
        )

        return from(
          httpClientWeb.download<Blob>({
            responseType: "blob",
            mode: "cors",
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
          takeUntil(merge(userCancelWithFlag$, lifecycleCancelWithFlag$)),
          throwIfEmpty(() =>
            cancelReason === "lifecycle"
              ? new LifecycleCancelError()
              : new CancelError(),
          ),
        )
      },
      onSuccess: onResolve,
      onError: (error) => {
        if (error instanceof LifecycleCancelError) {
          return
        }

        onError(error)
      },
    })

    useEffect(() => {
      const onUnmount$ = new ReplaySubject<void>(1)

      download({
        onUnmount$,
      })

      return () => {
        onUnmount$.next()
        onUnmount$.complete()
      }
    }, [download])

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
