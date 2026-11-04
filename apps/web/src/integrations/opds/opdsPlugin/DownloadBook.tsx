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
import { useLiveRef, useMutation$ } from "reactjrx"
import {
  isOpdsBookLinkData,
  ObokuErrorCode,
  type OpdsBookLinkData,
} from "@oboku/shared"
import type { DownloadBookComponentProps } from "../../plugins/types"
import { useExtractConnectorData } from "../../../connectors/useExtractConnectorData"
import { CancelError } from "../../../errors/errors.shared"
import { isXMLHttpResponseError } from "../../../http/httpClient.web"
import { useDownload } from "../../../http/useDownload"
import { fromAbortSignal } from "../../../common/rxjs/fromAbortSignal"
import { useEffectWithUnmount$ } from "../../../common/rxjs/useEffectWithUnmount$"
import { scheduleDelayedEffect } from "../../../common/useDelayEffect"
import { downloadOpdsBook } from "./download"

const isRefusedLogin = (error: unknown) =>
  isXMLHttpResponseError(error) &&
  (error.status === 401 || error.status === 403)

export const DownloadBook = memo(function DownloadBook({
  link,
  onDownloadProgress,
  onError,
  onResolve,
  signal,
}: DownloadBookComponentProps<"opds">) {
  const { mutateAsync: extractConnectorData } = useExtractConnectorData(
    { type: "opds" },
    { meta: { suppressGlobalErrorToast: true } },
  )
  const { mutateAsync: downloadBlob } = useDownload({
    meta: { suppressGlobalErrorToast: true },
  })
  const onErrorRef = useLiveRef(onError)
  const { connectorId } = link.data
  const bookLinkData = isOpdsBookLinkData(link.data) ? link.data : undefined

  const { mutate: download } = useMutation$({
    mutationFn: function downloadWithConnector({
      connectorId: connectorIdParam,
      bookLinkData: { acquisition, title },
      onUnmount$,
    }: {
      connectorId: string
      bookLinkData: OpdsBookLinkData
      onUnmount$: Observable<void>
    }) {
      const abortController = new AbortController()

      const cancel$ = merge(fromAbortSignal(signal), onUnmount$).pipe(
        tap(function abortDownload() {
          abortController.abort()
        }),
      )

      return from(extractConnectorData({ connectorId: connectorIdParam })).pipe(
        mergeMap(function downloadFromCatalog({ data: connector }) {
          return downloadOpdsBook({
            acquisition,
            title,
            connector,
            download: downloadBlob,
            onDownloadProgress,
            signal: abortController.signal,
          })
        }),
        takeUntil(cancel$),
        throwIfEmpty(function toCancelError() {
          return new CancelError()
        }),
      )
    },
    onSuccess: onResolve,
    onError: function reportDownloadError(error) {
      onError(
        isRefusedLogin(error)
          ? new Error(
              "The OPDS catalog refused the download. Check the username and password of its connector.",
            )
          : error,
      )
    },
    meta: { suppressGlobalErrorToast: true },
  })

  useEffectWithUnmount$(
    function downloadOnceMounted(onUnmount$) {
      return scheduleDelayedEffect(function startDownload() {
        if (!connectorId || !bookLinkData) {
          onErrorRef.current(ObokuErrorCode.ERROR_LINK_INVALID)

          return
        }

        download({ connectorId, bookLinkData, onUnmount$ })
      }, 1)
    },
    [bookLinkData, connectorId, download, onErrorRef],
  )

  return null
})
