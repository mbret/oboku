import { catchError, combineLatest } from "rxjs"
import { gsiOrThrow$ } from "../../../google/gsi"
import { gapiOrThrow$, useLoadGapi } from "./gapi"
import { createDialog } from "../../../common/dialogs/createDialog"
import { useCallback } from "react"

export const useGoogleScripts = () => {
  const { mutate: loadGapi } = useLoadGapi()

  const getGoogleScripts = useCallback(
    () =>
      combineLatest([gsiOrThrow$, gapiOrThrow$]).pipe(
        catchError((error) => {
          createDialog({
            autoStart: true,
            title: "Script error",
            content:
              "One or several required Google scripts has not been loaded yet. If the problem persist visit the plugin settings page to try reloading them.",
          })

          loadGapi()

          throw error
        }),
      ),
    [loadGapi],
  )

  return { getGoogleScripts }
}
