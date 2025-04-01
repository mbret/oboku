import { useAccessToken } from "./useAccessToken"
import { finalize, first, from, switchMap } from "rxjs"
import { useGoogleScripts } from "./scripts"
import { READER_ACCEPTED_MIME_TYPES } from "@oboku/shared"
import { configuration } from "../../../config/configuration"

export const useDrivePicker = ({
  requestPopup,
}: {
  requestPopup: () => Promise<boolean>
}) => {
  const { requestToken } = useAccessToken({ requestPopup })
  const { getGoogleScripts } = useGoogleScripts()

  const pick = ({ select }: { select: "file" | "folder" }) =>
    getGoogleScripts().pipe(
      first(),
      switchMap(([gsi]) => {
        return requestToken({
          scope: [`https://www.googleapis.com/auth/drive.readonly`],
        }).pipe(
          switchMap((accessToken) => {
            let picker: google.picker.Picker

            return from(
              new Promise<google.picker.ResponseObject>((resolve) => {
                picker = new gsi.picker.PickerBuilder()
                  .addView(
                    new google.picker.DocsView()
                      .setIncludeFolders(true)
                      .setMimeTypes(READER_ACCEPTED_MIME_TYPES.join(","))
                      .setSelectFolderEnabled(select === "folder"),
                  )
                  .setOAuthToken(accessToken.access_token)
                  .setDeveloperKey(configuration.GOOGLE_API_KEY ?? "")
                  .setAppId(configuration.GOOGLE_APP_ID ?? "")
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
              }),
            ).pipe(
              finalize(() => {
                picker.dispose()
              }),
            )
          }),
        )
      }),
    )

  return {
    pick,
  }
}
