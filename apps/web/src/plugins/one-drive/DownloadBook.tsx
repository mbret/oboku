import { useMutation } from "@tanstack/react-query"
import { memo } from "react"
import {
  from,
  merge,
  switchMap,
  takeUntil,
  throwIfEmpty,
  type Observable,
} from "rxjs"
import type { DownloadParams } from "../../http/httpClient.web"
import { useDownload } from "../../http/useDownload"
import { CancelError } from "../../errors/errors.shared"
import { fromAbortSignal } from "../../common/rxjs/fromAbortSignal"
import { useEffectWithUnmount$ } from "../../common/rxjs/useEffectWithUnmount$"
import { scheduleDelayedEffect } from "../../common/useDelayEffect"
import type { DownloadBookComponentProps } from "../types"
import { useMutation$ } from "reactjrx"
import { requestMicrosoftAccessToken } from "./auth/auth"
import { getOneDriveDownloadInfo$ } from "./graph"
import { useRequestPopupDialog } from "../useRequestPopupDialog"
import { ONE_DRIVE_GRAPH_SCOPES, ONE_DRIVE_PLUGIN_NAME } from "./constants"

export const DownloadBook = memo(function DownloadBook({
  link,
  onDownloadProgress,
  onError,
  onResolve,
  signal,
}: DownloadBookComponentProps<"one-drive">) {
  const requestPopup = useRequestPopupDialog(ONE_DRIVE_PLUGIN_NAME)
  const { mutateAsync: downloadBlob } = useDownload({
    meta: { suppressGlobalErrorToast: true },
  })

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
      const response = await downloadBlob({
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
    meta: { suppressGlobalErrorToast: true },
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
    meta: { suppressGlobalErrorToast: true },
  })

  useEffectWithUnmount$(
    (onUnmount$) =>
      scheduleDelayedEffect(
        () =>
          resolve({
            cancel$: merge(fromAbortSignal(signal), onUnmount$),
          }),
        1,
      ),
    [resolve, signal],
  )

  return null
})
