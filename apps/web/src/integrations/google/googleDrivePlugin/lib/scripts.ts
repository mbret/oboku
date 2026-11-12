import { catchError, defer, of } from "rxjs"
import type { UseMutation$Options } from "reactjrx"
import { getGsiOrThrow } from "../../gsi"
import { getGapiOrThrow, useLoadGapi } from "./gapi"
import { showDialog } from "../../../../common/dialogs/createDialog"
import { useCallback } from "react"

export const useGoogleScripts = (
  options?: Pick<UseMutation$Options<unknown>, "meta">,
) => {
  const { mutate: loadGapi } = useLoadGapi(options)

  const getGoogleScripts = useCallback(
    () =>
      defer(function readLoadedScripts() {
        return of({ gsi: getGsiOrThrow(), gapi: getGapiOrThrow() })
      }).pipe(
        catchError(function reportScriptsNotLoaded(error) {
          showDialog({
            title: "Script error",
            message:
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
