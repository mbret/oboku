import { useCallback } from "react"
import { of, switchMap, tap } from "rxjs"
import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { useDrivePicker } from "./useDrivePicker"
import { CancelError } from "../../../errors/errors.shared"
import { useHasFilesAccess } from "./useHasFilesAccess"

export const useRequestFilesAccess = ({
  requestPopup,
}: {
  requestPopup: () => Promise<boolean>
}) => {
  const hasFilesAccess = useHasFilesAccess()
  const { pick } = useDrivePicker({
    scope: ["https://www.googleapis.com/auth/drive.file"],
    requestPopup,
  })

  return useCallback(
    (fileIds: string[]) =>
      hasFilesAccess(fileIds).pipe(
        switchMap((hasFilesAccess) => {
          if (hasFilesAccess) {
            return of(null)
          }

          const files$ = pick({
            fileIds: fileIds,
          })

          return files$.pipe(
            tap((pickerResult) => {
              if (pickerResult.action === google.picker.Action.CANCEL) {
                throw new CancelError()
              }

              if (pickerResult.action === google.picker.Action.ERROR) {
                throw new ObokuSharedError(ObokuErrorCode.UNKNOWN)
              }
            }),
          )
        }),
      ),
    [pick, hasFilesAccess],
  )
}
