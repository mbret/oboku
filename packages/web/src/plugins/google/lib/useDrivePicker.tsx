import { useCallback } from "react"
import { DEVELOPER_KEY, APP_ID } from "./constants"
import { useGoogle } from "./useGsiClient"
import { useAccessToken } from "./useAccessToken"
import { finalize, from, switchMap } from "rxjs"

export const useDrivePicker = ({
  requestPopup
}: {
  requestPopup: () => Promise<boolean>
}) => {
  const { lazyGsi } = useGoogle()
  const { requestToken } = useAccessToken({ requestPopup })

  const pick = useCallback(
    ({ select }: { select: "file" | "folder" }) => {
      return from(lazyGsi).pipe(
        switchMap((gsi) =>
          from(
            requestToken({
              scope: [`https://www.googleapis.com/auth/drive.readonly`]
            })
          ).pipe(
            switchMap((accessToken) => {
              let picker: google.picker.Picker

              return from(
                new Promise<google.picker.ResponseObject>((resolve) => {
                  picker = new gsi.picker.PickerBuilder()
                    .addView(
                      new google.picker.DocsView()
                        .setIncludeFolders(true)
                        .setSelectFolderEnabled(
                          select === "folder" ? true : false
                        )
                    )
                    .setOAuthToken(accessToken.access_token)
                    .setDeveloperKey(DEVELOPER_KEY)
                    .setAppId(APP_ID)
                    .setCallback((data) => {
                      // type is broken and does not have loaded https://developers.google.com/picker/docs/reference#action
                      if (
                        data.action === gsi.picker.Action.CANCEL ||
                        data.action === gsi.picker.Action.PICKED
                      ) {
                        resolve(data)
                      }
                    })
                    .build()

                  picker.setVisible(true)
                })
              ).pipe(
                finalize(() => {
                  picker.dispose()
                })
              )
            })
          )
        )
      )
    },
    [lazyGsi, requestToken]
  )

  return {
    pick
  }
}
