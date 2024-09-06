import { Observable, tap } from "rxjs"
import { useNetworkState } from "react-use"
import { createDialog } from "../dialogs/createDialog"
import { OfflineError } from "../../errors/errors.shared"

export const useWithNetwork = () => {
  const networkState = useNetworkState()

  return <T>(stream: Observable<T>) =>
    stream.pipe(
      tap(() => {
        if (!networkState.online) {
          createDialog({ preset: "OFFLINE", autoStart: true })

          throw new OfflineError()
        }
      })
    )
}
