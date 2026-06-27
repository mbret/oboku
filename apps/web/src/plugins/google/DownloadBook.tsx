import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { memo } from "react"
import {
  catchError,
  from,
  map,
  merge,
  mergeMap,
  switchMap,
  takeUntil,
  tap,
  throwIfEmpty,
  type Observable,
} from "rxjs"
import { useDownload } from "../../http/useDownload"
import { CancelError } from "../../errors/errors.shared"
import { fromAbortSignal } from "../../common/rxjs/fromAbortSignal"
import { useEffectWithUnmount$ } from "../../common/rxjs/useEffectWithUnmount$"
import { scheduleDelayedEffect } from "../../common/useDelayEffect"
import {
  isDriveResponseError,
  useDriveFilesGet,
} from "../../google/useDriveFilesGet"
import type { DownloadBookComponentProps } from "../types"
import { useRequestPopupDialog } from "../useRequestPopupDialog"
import { useMutation$ } from "reactjrx"
import { useGoogleScripts } from "./lib/scripts"
import { useRequestFilesAccess } from "./lib/useRequestFilesAccess"
import { PLUGIN_NAME } from "./lib/constants"
import { configuration } from "../../config/configuration"

export const DownloadBook = memo(
  ({
    link,
    onDownloadProgress,
    onError,
    onResolve,
    signal,
  }: DownloadBookComponentProps<"DRIVE">) => {
    const requestPopup = useRequestPopupDialog(PLUGIN_NAME)
    const { getGoogleScripts } = useGoogleScripts()
    const requestFilesAccess = useRequestFilesAccess({
      requestPopup,
    })
    const getDriveFile = useDriveFilesGet()
    const { mutateAsync: downloadBlob } = useDownload({
      meta: { suppressGlobalErrorToast: true },
    })
    const { mutate: download } = useMutation$({
      mutationFn: ({ onUnmount$ }: { onUnmount$: Observable<void> }) => {
        const { fileId } = link.data
        const abortController = new AbortController()

        const cancel$ = merge(fromAbortSignal(signal), onUnmount$).pipe(
          tap(() => abortController.abort()),
        )

        return getGoogleScripts().pipe(
          switchMap(([, gapi]) =>
            requestFilesAccess(gapi, [fileId]).pipe(
              switchMap(() =>
                getDriveFile(gapi, {
                  fileId,
                  fields: "name,size",
                }).pipe(
                  mergeMap((info) =>
                    from(
                      downloadBlob({
                        headers: {
                          Authorization: `Bearer ${gapi.auth.getToken().access_token}`,
                        },
                        onDownloadProgress: (event) => {
                          const totalSize =
                            parseInt(info.result.size || "1", 10) || 1

                          onDownloadProgress(event.loaded / totalSize)
                        },
                        responseType: "blob",
                        signal: abortController.signal,
                        url: `https://content.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${configuration.GOOGLE_API_KEY ?? ""}`,
                      }),
                    ).pipe(
                      map((mediaResponse) => ({
                        data: mediaResponse.data,
                        fileName: info.result.name || fileId,
                      })),
                    ),
                  ),
                ),
              ),
              catchError((error) => {
                if (isDriveResponseError(error) && error.status === 404) {
                  throw new ObokuSharedError(
                    ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND,
                    error,
                  )
                }

                throw error
              }),
            ),
          ),
          takeUntil(cancel$),
          throwIfEmpty(() => new CancelError()),
        )
      },
      onSuccess: onResolve,
      onError,
      meta: { suppressGlobalErrorToast: true },
    })

    useEffectWithUnmount$(
      (onUnmount$) => scheduleDelayedEffect(() => download({ onUnmount$ }), 1),
      [download],
    )

    return null
  },
)
