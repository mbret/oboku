import { FC, useEffect, useMemo, useRef } from "react"
import { DEVELOPER_KEY, APP_ID } from "./constants"
import { useGetLazySignedGapi } from "./helpers"

export const DrivePicker: FC<{
  show: boolean
  onClose: (data: google.picker.ResponseObject | Error) => void
  select: "folder" | "file"
}> = ({ show, onClose, select }) => {
  const [getSignedGapi, gapi, { error }] = useGetLazySignedGapi()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const accessToken = gapi?.auth2
    .getAuthInstance()
    .currentUser.get()
    .getAuthResponse().access_token

  const picker = useMemo(() => {
    let picker = new google.picker.PickerBuilder()
      .addView(
        new google.picker.DocsView()
          .setIncludeFolders(true)
          .setSelectFolderEnabled(select === "folder" ? true : false)
      )
      .setOAuthToken(accessToken || "")
      .setDeveloperKey(DEVELOPER_KEY)
      .setAppId(APP_ID)
      .setCallback(async (data) => {
        onCloseRef.current(data)
      })

    if (select === "file") {
      // picker = picker.setSelectableMimeTypes('application/vnd.google-apps.file')
    } else {
      picker = picker.setSelectableMimeTypes(
        "application/vnd.google-apps.folder"
      )
    }

    return picker.build()
  }, [accessToken, select])

  useEffect(() => {
    if (error) {
      onClose(error)
    }
  }, [error, onClose])

  // @ts-ignore
  window.picker = picker

  useEffect(() => {
    if (show && accessToken) {
      picker.setVisible(true)
    } else {
      picker.setVisible(false)
    }
  }, [show, picker, accessToken])

  useEffect(() => {
    if (show && !accessToken) {
      getSignedGapi()
    }
  }, [getSignedGapi, show, accessToken])

  useEffect(() => {
    if (!show && picker) {
      picker.dispose()
    }

    return () => {
      picker.dispose()
    }
  }, [picker, show])

  return null
}
