import { memo } from "react"
import {
  from,
  merge,
  mergeMap,
  takeUntil,
  tap,
  throwIfEmpty,
  type Observable,
} from "rxjs"
import { ObokuErrorCode } from "@oboku/shared"
import { CancelError } from "../../errors/errors.shared"
import { fromAbortSignal } from "../../common/rxjs/fromAbortSignal"
import { useEffectWithUnmount$ } from "../../common/rxjs/useEffectWithUnmount$"
import { scheduleDelayedEffect } from "../../common/useDelayEffect"
import type { DownloadBookComponentProps } from "../types"
import { useLiveRef, useMutation$ } from "reactjrx"
import {
  clearSynologyDriveSession,
  useRequestSynologyDriveSession,
} from "./auth/auth"
import type { SynologyDriveSession } from "./client"
import { isXMLHttpResponseError } from "../../http/httpClient.web"
import { useDownload } from "../../http/useDownload"
import { downloadSynologyDriveBlob } from "./download/client"

export const DownloadBook = memo(
  ({
    link,
    onDownloadProgress,
    onError,
    onResolve,
    signal,
  }: DownloadBookComponentProps<"synology-drive">) => {
    const requestSynologyDriveSession = useRequestSynologyDriveSession()
    const { mutateAsync: downloadBlob } = useDownload({
      meta: { suppressGlobalErrorToast: true },
    })
    const onErrorRef = useLiveRef(onError)
    const connectorId = link.data.connectorId

    const { mutate: download } = useMutation$({
      mutationFn: ({
        connectorId: connectorIdParam,
        onUnmount$,
      }: {
        connectorId: string
        onUnmount$: Observable<void>
      }) => {
        const { fileId } = link.data
        const abortController = new AbortController()

        const cancel$ = merge(fromAbortSignal(signal), onUnmount$).pipe(
          tap(() => abortController.abort()),
        )

        return from(
          requestSynologyDriveSession({
            connectorId: connectorIdParam,
          }),
        ).pipe(
          mergeMap(async (session: SynologyDriveSession) => {
            return await downloadSynologyDriveBlob({
              download: downloadBlob,
              fileId,
              onDownloadProgress,
              session,
              signal: abortController.signal,
            })
          }),
          takeUntil(cancel$),
          throwIfEmpty(() => new CancelError()),
        )
      },
      onSuccess: onResolve,
      onError: (error) => {
        if (error instanceof CancelError) {
          onError(error)

          return
        }

        if (isXMLHttpResponseError(error)) {
          if (error.status === 401 || error.status === 403) {
            clearSynologyDriveSession()
            onError(
              new Error(
                "Synology Drive denied the download. The selected connector may need to be updated.",
              ),
            )

            return
          }
        }

        clearSynologyDriveSession()
        onError(error)
      },
    })

    useEffectWithUnmount$(
      (onUnmount$) =>
        scheduleDelayedEffect(() => {
          if (!connectorId) {
            onErrorRef.current(ObokuErrorCode.ERROR_LINK_INVALID)

            return
          }

          download({ connectorId, onUnmount$ })
        }, 1),
      [connectorId, download, onErrorRef],
    )

    return null
  },
)
