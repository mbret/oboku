import { useGoogleScripts } from "../plugins/google/lib/scripts"
import { from, switchMap } from "rxjs"
import { useCallback } from "react"

type Params = NonNullable<Parameters<typeof gapi.client.drive.files.get>[0]>

export const useDriveFilesGet = () => {
  const { getGoogleScripts } = useGoogleScripts()

  return useCallback(
    (params: Params) =>
      getGoogleScripts().pipe(
        switchMap(([, gapi]) => {
          return from(gapi.client.drive.files.get(params))
        }),
      ),
    [getGoogleScripts],
  )
}
