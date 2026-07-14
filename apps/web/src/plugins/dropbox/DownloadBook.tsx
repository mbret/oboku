import { memo } from "react"
import { Dropbox, type DropboxResponse, type files } from "dropbox"
import {
  defer,
  from,
  map,
  merge,
  mergeMap,
  takeUntil,
  throwIfEmpty,
  type Observable,
} from "rxjs"
import type { DownloadBookComponentProps } from "../types"
import { authUser } from "./lib/auth"
import { CancelError } from "../../errors/errors.shared"
import { fromAbortSignal } from "../../common/rxjs/fromAbortSignal"
import { useEffectWithUnmount$ } from "../../common/rxjs/useEffectWithUnmount$"
import { scheduleDelayedEffect } from "../../common/useDelayEffect"
import { useRequestPopupDialog } from "../useRequestPopupDialog"
import { PLUGIN_NAME } from "./constants"
import { useMutation$ } from "reactjrx"
import { useConfig } from "../../config/useConfig"

type ResponseWithFileBlob = DropboxResponse<files.FileMetadata> & {
  result?: {
    fileBlob?: Blob
  }
}

export const DownloadBook = memo(
  ({
    link,
    onError,
    onResolve,
    signal,
  }: DownloadBookComponentProps<"dropbox">) => {
    const { data: config } = useConfig()
    const requestPopup = useRequestPopupDialog(PLUGIN_NAME)
    const { mutate: download } = useMutation$({
      mutationFn: ({ onUnmount$ }: { onUnmount$: Observable<void> }) =>
        defer(() =>
          from(authUser({ requestPopup, clientId: config?.DROPBOX_CLIENT_ID })),
        ).pipe(
          mergeMap((auth) => {
            const dropbox = new Dropbox({ auth })

            return from(
              dropbox.filesDownload({
                path: link.data.fileId,
              }),
            )
          }),
          map((response: ResponseWithFileBlob) => {
            if (!response.result?.fileBlob) {
              throw new Error("missing file blob")
            }

            return {
              data: response.result.fileBlob,
              fileName: response.result.name,
            }
          }),
          takeUntil(merge(fromAbortSignal(signal), onUnmount$)),
          throwIfEmpty(() => new CancelError()),
        ),
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
