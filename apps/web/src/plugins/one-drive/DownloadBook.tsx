import { useMutation } from "@tanstack/react-query"
import { memo, useCallback } from "react"
import {
  from,
  fromEvent,
  map,
  merge,
  of,
  ReplaySubject,
  switchMap,
  takeUntil,
  throwIfEmpty,
  type Observable,
} from "rxjs"
import { type DownloadParams, httpClientWeb } from "../../http/httpClient.web"
import { CancelError } from "../../errors/errors.shared"
import type { DownloadBookComponentProps } from "../types"
import { useMutation$ } from "reactjrx"
import { requestMicrosoftAccessToken } from "./auth/auth"
import { getOneDriveDownloadInfo$ } from "./graph"
import { useRequestPopupDialog } from "../useRequestPopupDialog"
import { useDelayEffect } from "../../common/useDelayEffect"
import { ONE_DRIVE_GRAPH_SCOPES, ONE_DRIVE_PLUGIN_NAME } from "./constants"

export const DownloadBook = memo(function DownloadBook({
  link,
  onDownloadProgress,
  onError,
  onResolve,
  signal,
}: DownloadBookComponentProps<"one-drive">) {
  const requestPopup = useRequestPopupDialog(ONE_DRIVE_PLUGIN_NAME)

  const { mutate: download } = useMutation({
    mutationFn: async ({
      url,
      fileName,
      size,
      signal,
    }: Omit<DownloadParams, "responseType" | "onDownloadProgress"> & {
      fileName: string
      size?: number
    }) => {
      const response = await httpClientWeb.download<Blob>({
        onDownloadProgress: (event) => {
          const totalSize = size || event.total || 1

          onDownloadProgress(event.loaded / totalSize)
        },
        responseType: "blob",
        signal,
        url,
      })

      return {
        data: response.data,
        fileName,
      }
    },
    onSuccess: onResolve,
    onError,
  })

  const { mutate: resolve } = useMutation$({
    mutationFn: ({ cancel$ }: { cancel$: Observable<void> }) => {
      return from(
        requestMicrosoftAccessToken({
          interaction: "allow-interactive",
          requestPopup,
          scopes: ONE_DRIVE_GRAPH_SCOPES,
        }),
      ).pipe(
        switchMap((authResult) =>
          getOneDriveDownloadInfo$({
            accessToken: authResult.accessToken,
            driveId: link.data.driveId,
            fileId: link.data.fileId,
          }),
        ),
        takeUntil(cancel$),
        throwIfEmpty(() => new CancelError()),
      )
    },
    onSuccess: (info) => {
      download({
        signal,
        url: info.downloadUrl,
        fileName: info.fileName,
        size: info.size,
      })
    },
    onError,
  })

  const startResolve = useCallback(() => {
    const onUnmount$ = new ReplaySubject<void>(1)
    const userCancel$: Observable<void> = signal.aborted
      ? of(undefined)
      : fromEvent(signal, "abort").pipe(map(() => undefined))

    resolve({
      cancel$: merge(userCancel$, onUnmount$),
    })

    return () => {
      onUnmount$.next()
      onUnmount$.complete()
    }
  }, [resolve, signal])

  useDelayEffect(startResolve, 1)

  return null
})
