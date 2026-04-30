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
import { useRequestToken } from "./useRequestToken"
import { isDefined } from "reactjrx"
import { GOOGLE_DRIVE_FILE_SCOPES } from "./constants"

/**
 * @returns list of files with access
 */
export const useHasFilesAccess = ({
  requestPopup,
}: {
  requestPopup: () => Promise<boolean>
}) => {
  const { requestToken } = useRequestToken({ requestPopup })
  const getDriveFile = useDriveFilesGet()

  return useCallback(
    (
      _gapi: typeof gapi,
      fileIds: readonly string[],
    ): Observable<gapi.client.Response<gapi.client.drive.File>[]> => {
      return requestToken({
        scope: GOOGLE_DRIVE_FILE_SCOPES,
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
