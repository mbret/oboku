import { catchError, combineLatest, first } from "rxjs"
import type { UseMutation$Options } from "reactjrx"
import { gsiOrThrow$ } from "../../../google/gsi"
import { gapiOrThrow$, useLoadGapi } from "./gapi"
import { showDialog } from "../../../common/dialogs/createDialog"
import { useCallback } from "react"

export const useGoogleScripts = (
  options?: Pick<UseMutation$Options<unknown>, "meta">,
) => {
  const { mutate: loadGapi } = useLoadGapi(options)

  const getGoogleScripts = useCallback(
    () =>
      combineLatest([gsiOrThrow$, gapiOrThrow$]).pipe(
        catchError((error) => {
          showDialog({
            title: "Script error",
            message:
              "One or several required Google scripts has not been loaded yet. If the problem persist visit the plugin settings page to try reloading them.",
          })

          loadGapi()

          throw error
        }),
        first(),
      ),
    [loadGapi],
  )

  return { getGoogleScripts }
}
