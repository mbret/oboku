import { memo, useEffect } from "react"
import { Dropbox, type DropboxResponse, type files } from "dropbox"
import {
  defer,
  from,
  fromEvent,
  map,
  merge,
  mergeMap,
  of,
  ReplaySubject,
  takeUntil,
  tap,
  throwIfEmpty,
  type Observable,
} from "rxjs"
import type { DownloadBookComponentProps } from "../types"
import { authUser } from "./lib/auth"
import { extractIdFromResourceId } from "./helpers"
import { CancelError, LifecycleCancelError } from "../../errors/errors.shared"
import { useRequestPopupDialog } from "../useRequestPopupDialog"
import { PLUGIN_NAME } from "./constants"
import { useMutation$ } from "reactjrx"

type ResponseWithFileBlob = DropboxResponse<files.FileMetadata> & {
  result?: {
    fileBlob?: Blob
  }
}

export const DownloadBook = memo(
  ({ link, onError, onResolve, signal }: DownloadBookComponentProps) => {
    const requestPopup = useRequestPopupDialog(PLUGIN_NAME)
    const { mutate: download } = useMutation$({
      mutationFn: ({ onUnmount$ }: { onUnmount$: Observable<void> }) => {
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

        return defer(() => from(authUser({ requestPopup }))).pipe(
          mergeMap((auth) => {
            const dropbox = new Dropbox({ auth })

            return from(
              dropbox.filesDownload({
                path: extractIdFromResourceId(link.resourceId),
              }),
            )
          }),
          map((response: ResponseWithFileBlob) => {
            if (!response.result?.fileBlob) {
              throw new Error("missing file blob")
            }

            return {
              data: response.result.fileBlob,
              name: response.result.name,
            }
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
