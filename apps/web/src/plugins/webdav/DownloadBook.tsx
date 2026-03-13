import { explodeWebdavResourceId, getWebDavLinkData } from "@oboku/shared"
import { createClient } from "webdav"
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
import { useLiveRef, useMutation$ } from "reactjrx"
import type { DownloadBookComponentProps } from "../types"
import { ObokuErrorCode } from "@oboku/shared"
import { useExtractConnectorData } from "../../connectors/useExtractConnectorData"
import { CancelError, LifecycleCancelError } from "../../errors/errors.shared"

export const DownloadBook = memo(
  ({ link, onError, onResolve, signal }: DownloadBookComponentProps) => {
    const { mutateAsync: extractConnectorData } = useExtractConnectorData({
      type: "webdav",
    })
    const { connectorId } = getWebDavLinkData(link.data ?? {})
    const onErrorRef = useLiveRef(onError)
    const { mutate: download } = useMutation$({
      mutationFn: ({
        connectorId: connectorIdParam,
        onUnmount$,
      }: {
        connectorId: string
        onUnmount$: Observable<void>
      }) => {
        let cancelReason: "user" | "lifecycle" | null = null
        const userCancel$: Observable<unknown> = signal.aborted
          ? of(null)
          : fromEvent(signal, "abort")

        const userCancelWithFlag$ = userCancel$.pipe(
          tap(() => {
            cancelReason = "user"
          }),
        )

        const lifecycleCancelWithFlag$ = onUnmount$.pipe(
          tap(() => {
            cancelReason = "lifecycle"
          }),
        )

        const { filename } = explodeWebdavResourceId(link.resourceId)

        return from(
          extractConnectorData({ connectorId: connectorIdParam }),
        ).pipe(
          mergeMap(({ data }) => {
            const client = createClient(data.url, {
              username: data.username,
              password: data.password,
            })

            return from(
              client.getFileContents(filename, {
                format: "binary",
              }),
            )
          }),
          mergeMap((content) => {
            if (!(content instanceof ArrayBuffer)) {
              throw new Error("Unknown data type")
            }

            return of({
              data: new Blob([content]),
              fileName: filename,
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
