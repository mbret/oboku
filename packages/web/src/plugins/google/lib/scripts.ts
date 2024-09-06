import {
  catchError,
  combineLatest,
  filter,
  first,
  mergeMap,
  Observable,
  retry,
  timer
} from "rxjs"
import { networkState$ } from "../../../common/utils"
import { Report } from "../../../debug/report.shared"
import { gsiOrThrow$ } from "./gsi"
import { gapiOrThrow$, useLoadGapi } from "./gapi"
import { createDialog } from "../../../common/dialogs/createDialog"

export const retryOnFailure = <O>(stream: Observable<O>) =>
  stream.pipe(
    /**
     * In case of error we retry in 1mn by default.
     * If network is offline, we wait for online and
     * retry right away. If we were online, it's unexpected
     * and will wait a couple of minutes before retrying
     */
    retry({
      delay: (error, retryCount) => {
        Report.error(error)

        return networkState$.pipe(
          first(),
          mergeMap((state) => {
            if (state === "online")
              return timer(retryCount > 5 ? 1000 * 60 * 5 : 1)

            return networkState$.pipe(
              first(),
              filter((state) => state === "online")
            )
          })
        )
      }
    })
  )

export const useGoogleScripts = () => {
  const { mutate: loadGapi } = useLoadGapi()

  const getGoogleScripts = () => {
    return combineLatest([gsiOrThrow$, gapiOrThrow$]).pipe(
      catchError((error) => {
        createDialog({
          autoStart: true,
          title: "Script error",
          content:
            "One or several required Google scripts has not been loaded yet. If the problem persist visit the plugin settings page to try reloading them."
        })

        loadGapi()

        throw error
      })
    )
  }

  return { getGoogleScripts }
}
