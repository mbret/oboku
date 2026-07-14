import type { SettingsConnectorDocType } from "@oboku/shared"
import { createClient } from "webdav"
import { memo } from "react"
import {
  from,
  merge,
  mergeMap,
  of,
  takeUntil,
  throwIfEmpty,
  type Observable,
} from "rxjs"
import { useLiveRef, useMutation$ } from "reactjrx"
import type { DownloadBookComponentProps } from "../types"
import { ObokuErrorCode } from "@oboku/shared"
import { useExtractConnectorData } from "../../connectors/useExtractConnectorData"
import { CancelError } from "../../errors/errors.shared"
import { fromAbortSignal } from "../../common/rxjs/fromAbortSignal"
import { useEffectWithUnmount$ } from "../../common/rxjs/useEffectWithUnmount$"
import { scheduleDelayedEffect } from "../../common/useDelayEffect"

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
  const { mutateAsync: extractConnectorData } = useExtractConnectorData(
    { type: connectorType },
    { meta: { suppressGlobalErrorToast: true } },
  )
  const onErrorRef = useLiveRef(onError)
  const { mutate: download } = useMutation$({
    mutationFn: ({
      connectorId: connectorIdParam,
      onUnmount$,
    }: {
      connectorId: string
      onUnmount$: Observable<void>
    }) =>
      from(extractConnectorData({ connectorId: connectorIdParam })).pipe(
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
        takeUntil(merge(fromAbortSignal(signal), onUnmount$)),
        throwIfEmpty(() => new CancelError()),
      ),
    onSuccess: onResolve,
    onError,
    meta: { suppressGlobalErrorToast: true },
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
