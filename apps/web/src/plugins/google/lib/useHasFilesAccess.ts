import { useCallback } from "react"
import { useDriveFilesGet } from "../../../google/useDriveFilesGet"
import { catchError, combineLatest, map, of, switchMap } from "rxjs"
import { useRequestPopupDialog } from "../../useRequestPopupDialog"
import { PLUGIN_NAME } from "./constants"
import { useRequestToken } from "./useRequestToken"

export const useHasFilesAccess = () => {
  const requestPopup = useRequestPopupDialog(PLUGIN_NAME)
  const { requestToken } = useRequestToken({ requestPopup })
  const getDriveFile = useDriveFilesGet()

  return useCallback(
    (_gapi: typeof gapi, fileIds: readonly string[]) => {
      const files$ = combineLatest(
        fileIds.map((fileId) =>
          getDriveFile(_gapi, {
            fileId,
            fields: "capabilities",
          }),
        ),
      )

      return requestToken({
        scope: ["https://www.googleapis.com/auth/drive.file"],
      }).pipe(
        switchMap(() =>
          files$.pipe(
            map((files) =>
              files.every((file) => file.result.capabilities?.canDownload),
            ),
            catchError(() => of(false)),
          ),
        ),
      )
    },
    [getDriveFile, requestToken],
  )
}
