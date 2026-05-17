import { memo } from "react"
import {
  from,
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
import { scheduleDelayedEffect } from "../../common/useDelayEffect"
import { useRequestPopupDialog } from "../useRequestPopupDialog"
import { requestMicrosoftAccessToken } from "./auth/auth"
import {
  ONE_DRIVE_GRAPH_WRITE_SCOPES,
  ONE_DRIVE_PLUGIN_NAME,
} from "./constants"
import { updateOneDriveDriveItemContent } from "./graph"

export const UpsertFile: UpsertFileComponent<"one-drive"> = memo(
  function OneDriveUpsertFile({
    link,
    file,
    contentType,
    onError,
    onProgress,
    onSuccess,
    signal,
  }) {
    const requestPopup = useRequestPopupDialog(ONE_DRIVE_PLUGIN_NAME)

    const { mutate: upsert } = useMutation$({
      mutationFn: ({
        onUnmount$,
        signal,
      }: {
        onUnmount$: Observable<void>
        signal: AbortSignal
      }) =>
        from(
          requestMicrosoftAccessToken({
            interaction: "allow-interactive",
            requestPopup,
            scopes: ONE_DRIVE_GRAPH_WRITE_SCOPES,
          }),
        ).pipe(
          switchMap((authResult) =>
            updateOneDriveDriveItemContent({
              accessToken: authResult.accessToken,
              contentType,
              driveId: link.data.driveId,
              file,
              fileId: link.data.fileId,
              onProgress,
            }),
          ),
          takeUntil(merge(fromAbortSignal(signal), onUnmount$)),
          throwIfEmpty(() => new CancelError()),
        ),
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
