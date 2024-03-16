import { Observable, tap } from "rxjs"
import { useNetworkState } from "react-use"
import { OfflineError } from "../errors/errors"
import { createDialog } from "../dialogs/createDialog"

export const useWithNetwork = () => {
  const networkState = useNetworkState()

  return <T>(stream: Observable<T>) =>
    stream.pipe(
      tap(() => {
        if (!networkState.online) {
          createDialog({ preset: "OFFLINE" })

          throw new OfflineError()
        }
      })
    )
}
