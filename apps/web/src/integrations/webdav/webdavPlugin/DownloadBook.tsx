import { memo } from "react"
import {
  from,
  map,
  merge,
  mergeMap,
  takeUntil,
  throwIfEmpty,
  type Observable,
} from "rxjs"
import { useLiveRef, useMutation$ } from "reactjrx"
import type { DownloadBookComponentProps } from "../../plugins/types"
import { ObokuErrorCode } from "@oboku/shared"
import { isProxiedThroughServer } from "../../../connectors/connectorDetails"
import { downloadThroughServerProxy } from "../../../download/downloadThroughServerProxy"
import { useExtractConnectorData } from "../../../connectors/useExtractConnectorData"
import { useHttpClientApi } from "../../../http"
import { CancelError } from "../../../errors/errors.shared"
import { fromAbortable } from "../../../common/rxjs/fromAbortable"
import { fromAbortSignal } from "../../../common/rxjs/fromAbortSignal"
import { useEffectWithUnmount$ } from "../../../common/rxjs/useEffectWithUnmount$"
import { scheduleDelayedEffect } from "../../../common/useDelayEffect"
import { resolveWebdavUrl } from "./auth/connect"
import { downloadFromWebdavServer } from "./download"
import type { WebdavBackedType } from "./constants"

type WebdavDownloadBookProps = DownloadBookComponentProps & {
  connectorType: WebdavBackedType
  connectorId: string | undefined
  filePath: string
  webdavUrl?: string
}

/**
 * Shared download component for plugins backed by a WebDAV endpoint. It reads
 * the file from `webdavUrl` when given, else from the connector's URL, or
 * through oboku's server for a connector that uses it as a proxy.
 */
export const WebdavDownloadBook = memo(function WebdavDownloadBook({
  link,
  onDownloadProgress,
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
  const httpClientApi = useHttpClientApi()
  const onErrorRef = useLiveRef(onError)
  const { mutate: download } = useMutation$({
    mutationFn: function downloadWithConnector({
      connectorId: connectorIdParam,
      onUnmount$,
    }: {
      connectorId: string
      onUnmount$: Observable<void>
    }) {
      return from(extractConnectorData({ connectorId: connectorIdParam })).pipe(
        mergeMap(function downloadFile({ data }) {
          return fromAbortable(function downloadUntilCancelled(downloadSignal) {
            return isProxiedThroughServer(data)
              ? downloadThroughServerProxy({
                  httpClientApi,
                  linkId: link._id,
                  password: data.password,
                  onDownloadProgress,
                  signal: downloadSignal,
                })
              : downloadFromWebdavServer({
                  url: resolveWebdavUrl({ connectorUrl: data.url, webdavUrl }),
                  username: data.username,
                  password: data.password,
                  filePath,
                  signal: downloadSignal,
                })
          })
        }),
        map(function toDownloadResult(file) {
          return {
            data: file,
            fileName: filePath.split("/").pop() ?? filePath,
          }
        }),
        takeUntil(merge(fromAbortSignal(signal), onUnmount$)),
        throwIfEmpty(() => new CancelError()),
      )
    },
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
