import type { SettingsConnectorDocType } from "@oboku/shared"
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

type WebdavDownloadBookProps = DownloadBookComponentProps & {
  connectorType: SettingsConnectorDocType["type"]
  connectorId: string | undefined
  filePath: string
  webdavUrl?: string
}

/**
 * Shared download component for plugins backed by a WebDAV endpoint.
 * When `webdavUrl` is provided it is used directly; otherwise the URL
 * is read from the connector data (standard webdav flow).
 */
export const WebdavDownloadBook = memo(function WebdavDownloadBook({
  onError,
  onResolve,
  signal,
  connectorType,
  connectorId,
  filePath,
  webdavUrl,
}: WebdavDownloadBookProps) {
  const { mutateAsync: extractConnectorData } = useExtractConnectorData({
    type: connectorType,
  })
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

      return from(extractConnectorData({ connectorId: connectorIdParam })).pipe(
        mergeMap(({ data }) => {
          const url = webdavUrl ?? data.url

          if (!url) {
            throw new Error("No WebDAV URL available")
          }

          const client = createClient(url, {
            username: data.username,
            password: data.password,
          })

          return from(
            client.getFileContents(filePath, {
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
            fileName: filePath.split("/").pop() ?? filePath,
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
})

export const DownloadBook = memo(function DownloadBook(
  props: DownloadBookComponentProps<"webdav">,
) {
  const { connectorId, filePath } = props.link.data

  return (
    <WebdavDownloadBook
      {...props}
      connectorType="webdav"
      connectorId={connectorId}
      filePath={filePath}
    />
  )
})
