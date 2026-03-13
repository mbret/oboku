import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { memo, useEffect } from "react"
import {
  catchError,
  from,
  fromEvent,
  map,
  merge,
  mergeMap,
  of,
  ReplaySubject,
  switchMap,
  takeUntil,
  tap,
  throwIfEmpty,
  type Observable,
} from "rxjs"
import { httpClientWeb } from "../../http/httpClient.web"
import { CancelError, LifecycleCancelError } from "../../errors/errors.shared"
import {
  isDriveResponseError,
  useDriveFilesGet,
} from "../../google/useDriveFilesGet"
import type { DownloadBookComponentProps } from "../types"
import { useRequestPopupDialog } from "../useRequestPopupDialog"
import { useMutation$ } from "reactjrx"
import { useGoogleScripts } from "./lib/scripts"
import { useRequestFilesAccess } from "./lib/useRequestFilesAccess"
import { extractIdFromResourceId } from "./lib/resources"
import { PLUGIN_NAME } from "./lib/constants"

export const DownloadBook = memo(
  ({
    link,
    onDownloadProgress,
    onError,
    onResolve,
    signal,
  }: DownloadBookComponentProps) => {
    const requestPopup = useRequestPopupDialog(PLUGIN_NAME)
    const { getGoogleScripts } = useGoogleScripts()
    const requestFilesAccess = useRequestFilesAccess({
      requestPopup,
    })
    const getDriveFile = useDriveFilesGet()
    const { mutate: download } = useMutation$({
      mutationFn: ({ onUnmount$ }: { onUnmount$: Observable<void> }) => {
        const fileId = extractIdFromResourceId(link.resourceId)
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
                      httpClientWeb.download<Blob>({
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
                        url: `https://content.googleapis.com/drive/v3/files/${fileId}?alt=media&key=AIzaSyBgTV-RQecG_TFwilsdUJXqKmeXEiNSWUg`,
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
                    "user",
                  )
                }

                throw error
              }),
            ),
          ),
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
      const onUnmount$ = new ReplaySubject<void>(1)
      download({
        onUnmount$,
      })

      return () => {
        onUnmount$.next()
        onUnmount$.complete()
      }
    }, [download])

    return null
  },
)
