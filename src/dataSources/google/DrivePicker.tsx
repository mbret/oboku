import { FC, useEffect, useMemo, useRef } from 'react'
import { DEVELOPER_KEY, APP_ID } from './constants'
import { useGetLazySignedGapi } from './helpers'

export const DrivePicker: FC<{ show: boolean, onClose: (data: any) => void }> = ({ show, onClose }) => {
  const [getSignedGapi, gapi] = useGetLazySignedGapi()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const accessToken = gapi?.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token

  const picker = useMemo(() => new google.picker.PickerBuilder()
    .addView(
      new google.picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true)
    )
    .setOAuthToken(accessToken || '')
    .setSelectableMimeTypes('application/vnd.google-apps.folder')
    .setDeveloperKey(DEVELOPER_KEY)
    .setAppId(APP_ID)
    .setCallback(async (data) => {
      onCloseRef.current(data)
    })
    .build(), [accessToken])

  useEffect(() => {
    if (show && !accessToken) {
      getSignedGapi()
    }
    if (show && accessToken) {
      picker.setVisible(true)
    } else {
      picker.setVisible(false)
    }
  }, [show, picker, accessToken, getSignedGapi])

  return null
}