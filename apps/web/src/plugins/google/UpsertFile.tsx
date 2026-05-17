import { memo } from "react"
import {
  merge,
  switchMap,
  takeUntil,
  throwIfEmpty,
  type Observable,
} from "rxjs"
import { useMutation$ } from "reactjrx"
import type { UpsertFileComponent } from "../types"
import { CancelError } from "../../errors/errors.shared"
import { fromAbortSignal } from "../../common/rxjs/fromAbortSignal"
import { useEffectWithUnmount$ } from "../../common/rxjs/useEffectWithUnmount$"
import { useRequestPopupDialog } from "../useRequestPopupDialog"
import { useGoogleScripts } from "./lib/scripts"
import { useRequestToken } from "./lib/useRequestToken"
import { useRequestFilesAccess } from "./lib/useRequestFilesAccess"
import { GOOGLE_DRIVE_FILE_SCOPES, PLUGIN_NAME } from "./lib/constants"
import { updateDriveFileMedia } from "./lib/updateDriveFileMedia"
import { scheduleDelayedEffect } from "../../common/useDelayEffect"

// `requestFilesAccess` is required: without the picker-token scope
// for this fileId Drive returns 401/403 even with a valid OAuth token.
export const UpsertFile: UpsertFileComponent<"DRIVE"> = memo(
  function GoogleUpsertFile({
    link,
    file,
    contentType,
    onError,
    onProgress,
    onSuccess,
    signal,
  }) {
    const requestPopup = useRequestPopupDialog(PLUGIN_NAME)
    const { getGoogleScripts } = useGoogleScripts()
    const { requestToken } = useRequestToken({ requestPopup })
    const requestFilesAccess = useRequestFilesAccess({ requestPopup })

    const { mutate: upsert } = useMutation$({
      mutationFn: ({
        onUnmount$,
        signal,
      }: {
        onUnmount$: Observable<void>
        signal: AbortSignal
      }) => {
        const fileId = link.data.fileId

        return getGoogleScripts().pipe(
          switchMap(([, gapiInstance]) =>
            requestFilesAccess(gapiInstance, [fileId]).pipe(
              switchMap(() =>
                requestToken({ scope: GOOGLE_DRIVE_FILE_SCOPES }),
              ),
            ),
          ),
          switchMap((accessToken) =>
            updateDriveFileMedia({
              fileId,
              file,
              accessToken: accessToken.access_token,
              contentType,
              onProgress,
            }),
          ),
          takeUntil(merge(fromAbortSignal(signal), onUnmount$)),
          throwIfEmpty(() => new CancelError()),
        )
      },
      onSuccess: () => onSuccess(),
      onError: (error) => onError(error),
    })

    useEffectWithUnmount$(
      (onUnmount$) =>
        scheduleDelayedEffect(() => upsert({ onUnmount$, signal }), 1),
      [upsert, signal],
    )

    return null
  },
)
