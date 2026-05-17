import { type Observable, tap } from "rxjs"
import { useNetworkState } from "react-use"
import { showDialog } from "../dialogs/createDialog"
import { createOfflineDialogOptions } from "../dialogs/presets"
import { OfflineError } from "../../errors/errors.shared"

export const useWithNetwork = () => {
  const networkState = useNetworkState()

  return <T>(stream: Observable<T>) =>
    stream.pipe(
      tap(() => {
        if (!networkState.online) {
          showDialog(createOfflineDialogOptions())

          throw new OfflineError()
        }
      }),
    )
}
