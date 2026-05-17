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
import { authUser } from "./lib/auth"
import { uploadFile } from "./lib/uploadFile"
import { PLUGIN_NAME } from "./constants"

export const UpsertFile: UpsertFileComponent<"dropbox"> = memo(
  function DropboxUpsertFile({
    link,
    file,
    onError,
    onProgress,
    onSuccess,
    signal,
  }) {
    const requestPopup = useRequestPopupDialog(PLUGIN_NAME)

    const { mutate: upsert } = useMutation$({
      mutationFn: ({
        onUnmount$,
        signal,
      }: {
        onUnmount$: Observable<void>
        signal: AbortSignal
      }) =>
        from(authUser({ requestPopup })).pipe(
          switchMap((auth) =>
            uploadFile({
              accessToken: auth.getAccessToken(),
              path: link.data.fileId,
              file,
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
