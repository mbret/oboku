import { Observable, tap } from "rxjs"
import { useDialogManager } from "../dialog"
import { useNetworkState } from "react-use"
import { OfflineError } from "../../errors"

export const useWithNetwork = () => {
  const dialog = useDialogManager()
  const networkState = useNetworkState()

  return <T>(stream: Observable<T>) =>
    stream.pipe(
      tap(() => {
        if (!networkState.online) {
          dialog({ preset: "OFFLINE" })

          throw new OfflineError()
        }
      })
    )
}
