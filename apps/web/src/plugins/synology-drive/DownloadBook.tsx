import { explodeSynologyDriveResourceId } from "@oboku/shared"
import { memo, useEffect } from "react"
import {
  from,
  fromEvent,
  merge,
  mergeMap,
  of,
  ReplaySubject,
  takeUntil,
  tap,
  throwIfEmpty,
  type Observable,
} from "rxjs"
import { ObokuErrorCode } from "@oboku/shared"
import { CancelError, LifecycleCancelError } from "../../errors/errors.shared"
import type { DownloadBookComponentProps } from "../types"
import { useLiveRef, useMutation$ } from "reactjrx"
import {
  clearSynologyDriveSession,
  useRequestSynologyDriveSession,
} from "./auth/auth"
import type { SynologyDriveSession } from "./client"
import { isXMLHttpResponseError } from "../../http/httpClient.web"
import { downloadSynologyDriveBlob } from "./download/client"

export const DownloadBook = memo(
  ({
    link,
    onDownloadProgress,
    onError,
    onResolve,
    signal,
  }: DownloadBookComponentProps) => {
    const requestSynologyDriveSession = useRequestSynologyDriveSession()
    const onErrorRef = useLiveRef(onError)
    const connectorId =
      link.type === "synology-drive" ? link.data?.connectorId : undefined

    const { mutate: download } = useMutation$({
      mutationFn: ({
        connectorId: connectorIdParam,
        onUnmount$,
      }: {
        connectorId: string
        onUnmount$: Observable<void>
      }) => {
        const { fileId } = explodeSynologyDriveResourceId(link.resourceId)
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

        return from(
          requestSynologyDriveSession({
            connectorId: connectorIdParam,
          }),
        ).pipe(
          mergeMap(async (session: SynologyDriveSession) => {
            return await downloadSynologyDriveBlob({
              fileId,
              onDownloadProgress,
              session,
              signal: abortController.signal,
            })
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

    useEffect(() => {
      if (!connectorId) {
        onErrorRef.current(ObokuErrorCode.ERROR_LINK_INVALID)

        return
      }

      const onUnmount$ = new ReplaySubject<void>(1)

      download({
        connectorId,
        onUnmount$,
      })

      return () => {
        onUnmount$.next()
        onUnmount$.complete()
      }
    }, [connectorId, download, onErrorRef])

    return null
  },
)
