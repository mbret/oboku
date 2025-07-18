import { useCallback } from "react"
import { useDriveFilesGet } from "../../../google/useDriveFilesGet"
import { catchError, combineLatest, map, of } from "rxjs"

export const useHasFilesAccess = () => {
  const getDriveFile = useDriveFilesGet()

  return useCallback(
    (fileIds: string[]) => {
      const files$ = combineLatest(
        fileIds.map((fileId) =>
          getDriveFile({
            fileId,
            fields: "capabilities",
          }),
        ),
      )

      return files$.pipe(
        map((files) =>
          files.every((file) => file.result.capabilities?.canDownload),
        ),
        catchError(() => of(false)),
      )
    },
    [getDriveFile],
  )
}
