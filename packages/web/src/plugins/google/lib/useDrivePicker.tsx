import { DEVELOPER_KEY, APP_ID } from "./constants"
import { useAccessToken } from "./useAccessToken"
import { finalize, first, from, switchMap } from "rxjs"
import { gsiOrThrow$ } from "./gsi"

export const useDrivePicker = ({
  requestPopup
}: {
  requestPopup: () => Promise<boolean>
}) => {
  const { requestToken } = useAccessToken({ requestPopup })

  const pick = ({ select }: { select: "file" | "folder" }) =>
    gsiOrThrow$.pipe(
      first(),
      switchMap((gsi) => {
        return requestToken({
          scope: [`https://www.googleapis.com/auth/drive.readonly`]
        }).pipe(
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
      })
    )

  return {
    pick
  }
}
