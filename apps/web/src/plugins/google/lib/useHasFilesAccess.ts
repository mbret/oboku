import { useCallback } from "react"
import { useDriveFilesGet } from "../../../google/useDriveFilesGet"
import {
  catchError,
  combineLatest,
  map,
  type Observable,
  of,
  switchMap,
} from "rxjs"
import { useRequestPopupDialog } from "../../useRequestPopupDialog"
import { PLUGIN_NAME } from "./constants"
import { useRequestToken } from "./useRequestToken"
import { isDefined } from "reactjrx"

/**
 * @returns list of files with access
 */
export const useHasFilesAccess = () => {
  const requestPopup = useRequestPopupDialog(PLUGIN_NAME)
  const { requestToken } = useRequestToken({ requestPopup })
  const getDriveFile = useDriveFilesGet()

  return useCallback(
    (
      _gapi: typeof gapi,
      fileIds: readonly string[],
    ): Observable<gapi.client.Response<gapi.client.drive.File>[]> => {
      return requestToken({
        scope: ["https://www.googleapis.com/auth/drive.file"],
      }).pipe(
        switchMap(() => {
          const files$ = combineLatest(
            fileIds.map((fileId) =>
              getDriveFile(_gapi, {
                fileId,
                supportsAllDrives: true,
                supportsTeamDrives: true,
                fields: "capabilities, id",
              }).pipe(catchError(() => of(null))),
            ),
          )

          return files$.pipe(
            map((files) =>
              files
                .filter((file) => file?.result.capabilities?.canDownload)
                .filter(isDefined),
            ),
            catchError(() => of([])),
          )
        }),
      )
    },
    [getDriveFile, requestToken],
  )
}
