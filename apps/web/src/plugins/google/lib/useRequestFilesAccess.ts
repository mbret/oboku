import { useCallback } from "react"
import { of, switchMap, tap } from "rxjs"
import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { useDrivePicker } from "./useDrivePicker"
import { CancelError } from "../../../errors/errors.shared"
import { useHasFilesAccess } from "./useHasFilesAccess"
import { useQueryClient } from "@tanstack/react-query"
import { getUseDriveFileQueryKey } from "../../../google/useDriveFile"

export const useRequestFilesAccess = ({
  requestPopup,
}: {
  requestPopup: () => Promise<boolean>
}) => {
  const queryClient = useQueryClient()
  const hasFilesAccess = useHasFilesAccess()
  const { pick } = useDrivePicker({
    scope: ["https://www.googleapis.com/auth/drive.file"],
    requestPopup,
  })

  return useCallback(
    (_gapi: typeof gapi, fileIds: readonly string[]) =>
      hasFilesAccess(_gapi, fileIds).pipe(
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

              pickerResult.docs?.forEach((doc) => {
                queryClient.invalidateQueries({
                  queryKey: getUseDriveFileQueryKey({
                    id: doc.id,
                  }),
                  exact: false,
                })
              })
            }),
          )
        }),
      ),
    [pick, hasFilesAccess, queryClient],
  )
}
