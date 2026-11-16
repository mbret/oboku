import { memo } from "react"
import {
  from,
  map,
  merge,
  mergeMap,
  takeUntil,
  tap,
  throwIfEmpty,
  type Observable,
} from "rxjs"
import { useLiveRef, useMutation$ } from "reactjrx"
import type { DownloadBookComponentProps } from "../../plugins/types"
import { linksDownload, ObokuErrorCode } from "@oboku/shared"
import { isConnectedThroughServer } from "../../../connectors/connectorDetails"
import { useExtractConnectorData } from "../../../connectors/useExtractConnectorData"
import { useHttpClientApi } from "../../../http"
import { CancelError } from "../../../errors/errors.shared"
import { fromAbortSignal } from "../../../common/rxjs/fromAbortSignal"
import { useEffectWithUnmount$ } from "../../../common/rxjs/useEffectWithUnmount$"
import { scheduleDelayedEffect } from "../../../common/useDelayEffect"
import { createWebdavClient, resolveWebdavUrl } from "./auth/connect"
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
 * through oboku's API for a connector that connects through it.
 */
export const WebdavDownloadBook = memo(function WebdavDownloadBook({
  link,
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
      const abortController = new AbortController()

      const cancel$ = merge(fromAbortSignal(signal), onUnmount$).pipe(
        tap(function abortDownload() {
          abortController.abort()
        }),
      )

      return from(extractConnectorData({ connectorId: connectorIdParam })).pipe(
        mergeMap(async function downloadFile({ data }) {
          if (isConnectedThroughServer(data)) {
            const { data: file } = await linksDownload({
              client: httpClientApi.sdkClient,
              body: {
                linkId: link._id,
                providerCredentials: { password: data.password },
              },
              parseAs: "blob",
              signal: abortController.signal,
            })

            // The reader takes a blob's type as the book's format, and the
            // API's `application/octet-stream` is none.
            return new Blob([file])
          }

          const client = createWebdavClient({
            url: resolveWebdavUrl({ connectorUrl: data.url, webdavUrl }),
            username: data.username,
            password: data.password,
          })
          const content = await client.getFileContents(filePath, {
            format: "binary",
          })

          if (!(content instanceof ArrayBuffer)) {
            throw new Error("Unknown data type")
          }

          return new Blob([content])
        }),
        map(function toDownloadResult(file) {
          return {
            data: file,
            fileName: filePath.split("/").pop() ?? filePath,
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
