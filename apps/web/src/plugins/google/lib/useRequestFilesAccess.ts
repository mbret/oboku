import { useCallback } from "react"
import { of, switchMap, tap } from "rxjs"
import { difference, ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { useDrivePicker } from "./useDrivePicker"
import { CancelError } from "../../../errors/errors.shared"
import { useHasFilesAccess } from "./useHasFilesAccess"
import { useQueryClient } from "@tanstack/react-query"
import { getUseDriveFileQueryKey } from "../../../google/useDriveFile"
import { isDefined } from "reactjrx"

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
        switchMap((hasAccess) => {
          const hasAccessFileIds = hasAccess.map((file) => file.result.id)
          const nonAccessedFileIds = difference(
            fileIds,
            hasAccessFileIds,
          ).filter(isDefined)

          if (nonAccessedFileIds.length === 0) {
            return of(null)
          }

          const files$ = pick({
            fileIds: nonAccessedFileIds,
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
